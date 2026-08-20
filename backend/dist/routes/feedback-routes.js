import { Router } from 'express';
import multer from 'multer';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { feedbackSchema } from '../validators/feedback-validator.js';
import { getUploadRootDir } from '../utils/upload-paths.js';
export const feedbackRoutes = Router();
const upload = multer({ dest: path.join(getUploadRootDir(), 'feedback') });
const toPublicUploadPath = (value) => (value ? `/uploads/feedback/${path.basename(value)}` : null);
const duplicateSubmissionWindowMs = 10_000;
const duplicateSubmissionCache = new Map();
async function submitFeedback(request, response, next) {
    try {
        const input = feedbackSchema.parse({
            ...request.body,
            type: resolveSubmissionType(request.baseUrl, request.body.type),
        });
        const source = input.source === 'common_qr' ? 'common_qr' : 'product_qr';
        const qr = input.qrToken
            ? await prisma.qRCode.findUnique({
                where: { code: input.qrToken },
                select: { id: true, productId: true, batchId: true },
            })
            : null;
        if (input.qrToken && !qr) {
            return response.status(404).json({ error: 'QR code not found' });
        }
        const duplicate = await findRecentDuplicateSubmission({
            request,
            input,
            source,
            qrCodeId: qr?.id ?? null,
            productId: qr?.productId ?? null,
        });
        if (duplicate) {
            return response.status(409).json({
                error: 'Duplicate submission detected. Please wait before submitting again.',
                code: 'duplicate_submission',
                id: duplicate.feedbackId,
                status: duplicate.status,
            });
        }
        const created = await prisma.feedback.create({
            data: {
                rating: input.rating,
                message: input.message ?? null,
                imageUrl: toPublicUploadPath(request.file?.path),
                quality: input.quality ?? null,
                category: input.category ?? null,
                status: 'new',
                source,
                ...(qr ? { productId: qr.productId, batchId: qr.batchId, qrCodeId: qr.id } : {}),
                ...(input.type === 'question' && input.message ? { question: { create: { question: input.message } } } : {}),
                ...(input.type === 'compliment'
                    ? { compliment: { create: { message: input.message ?? 'Customer compliment submitted' } } }
                    : {}),
                ...(input.type === 'complaint'
                    ? { complaint: { create: { severity: 1, resolutionNotes: input.category ?? input.message ?? 'Customer complaint submitted' } } }
                    : {}),
            },
        });
        rememberSubmissionFingerprint(request, {
            type: input.type,
            source,
            rating: input.rating ?? null,
            message: normalizeText(input.message),
            quality: normalizeText(input.quality),
            category: normalizeText(input.category),
            qrCodeId: qr?.id ?? null,
            productId: qr?.productId ?? null,
        }, created);
        response.status(201).json({ id: created.id, status: created.status });
    }
    catch (error) {
        next(error);
    }
}
feedbackRoutes.post('/', upload.single('image'), submitFeedback);
feedbackRoutes.get('/', requireAuth, async (request, response, next) => {
    try {
        const page = Math.max(1, Number(request.query.page) || 1);
        const limit = Math.min(1000, Math.max(1, Number(request.query.limit) || 20));
        const offset = (page - 1) * limit;
        const [items, totalRow, summaryRow, commonQrRow, distributionRows] = await Promise.all([
            prisma.$queryRawUnsafe(`
        SELECT
          f.id,
          f.rating,
          f.message,
          f.image_url,
          f.quality,
          f.category,
          f.status::text AS status,
          f.source,
          f.submitted_at,
          p.name AS product_name,
          CASE
            WHEN q.feedback_id IS NOT NULL THEN 'question'
            WHEN c.feedback_id IS NOT NULL THEN 'compliment'
            WHEN cp.feedback_id IS NOT NULL THEN 'complaint'
            ELSE 'feedback'
          END AS type
        FROM feedback f
        LEFT JOIN products p ON p.id = f.product_id
        LEFT JOIN questions q ON q.feedback_id = f.id
        LEFT JOIN compliments c ON c.feedback_id = f.id
        LEFT JOIN complaints cp ON cp.feedback_id = f.id
        ORDER BY f.submitted_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `),
            prisma.$queryRawUnsafe(`SELECT COUNT(*) AS total FROM feedback`),
            prisma.$queryRawUnsafe(`
        SELECT
          COUNT(*) AS total,
          ROUND(AVG(rating)::numeric, 1) AS average_rating
        FROM feedback
        WHERE rating IS NOT NULL
      `),
            prisma.$queryRawUnsafe(`
        SELECT COUNT(*) AS common_qr_total
        FROM feedback
        WHERE source = 'common_qr'
      `),
            prisma.$queryRawUnsafe(`
        SELECT rating, COUNT(*) AS count
        FROM feedback
        WHERE rating IS NOT NULL
        GROUP BY rating
        ORDER BY rating DESC
      `),
        ]);
        const total = Number(totalRow[0]?.total ?? 0);
        const ratedTotal = Number(summaryRow[0]?.total ?? 0);
        const averageRating = summaryRow[0]?.average_rating != null ? Number(summaryRow[0].average_rating) : null;
        const commonQrTotal = Number(commonQrRow[0]?.common_qr_total ?? 0);
        const distributionMap = new Map(distributionRows.map((row) => [row.rating, Number(row.count)]));
        response.json({
            items: items.map((f) => ({
                id: f.id,
                rating: f.rating,
                message: f.message,
                imageUrl: f.image_url,
                quality: f.quality,
                category: f.category,
                status: f.status,
                submittedAt: f.submitted_at,
                source: f.source,
                productName: f.product_name,
                sourceLabel: f.source === 'common_qr' ? 'Common QR' : f.product_name,
                type: f.type,
            })),
            summary: {
                total,
                totalRatings: ratedTotal,
                commonQrTotal,
                averageRating,
                ratingDistribution: [5, 4, 3, 2, 1].map((rating) => ({
                    rating,
                    count: distributionMap.get(rating) ?? 0,
                })),
            },
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    }
    catch (error) {
        next(error);
    }
});
function resolveSubmissionType(baseUrl, submittedType) {
    if (typeof submittedType === 'string' && submittedType.length) {
        return submittedType;
    }
    if (baseUrl.includes('complaint'))
        return 'complaint';
    if (baseUrl.includes('compliment'))
        return 'compliment';
    return 'feedback';
}
function normalizeText(value) {
    return value?.trim().replace(/\s+/g, ' ') || null;
}
function submissionFingerprint(request, input) {
    const payload = JSON.stringify({
        ip: request.ip ?? '',
        userAgent: request.headers['user-agent'] ?? '',
        ...input,
    });
    return createHash('sha256').update(payload).digest('hex');
}
function pruneDuplicateSubmissionCache(now = Date.now()) {
    for (const [key, value] of duplicateSubmissionCache.entries()) {
        if (value.expiresAt <= now)
            duplicateSubmissionCache.delete(key);
    }
}
function feedbackTypeOf(item) {
    if (item.question)
        return 'question';
    if (item.compliment)
        return 'compliment';
    if (item.complaint)
        return 'complaint';
    return 'feedback';
}
function rememberSubmissionFingerprint(request, input, created) {
    pruneDuplicateSubmissionCache();
    duplicateSubmissionCache.set(submissionFingerprint(request, input), {
        feedbackId: created.id,
        status: created.status,
        expiresAt: Date.now() + duplicateSubmissionWindowMs,
    });
}
async function findRecentDuplicateSubmission({ request, input, source, qrCodeId, productId, }) {
    const normalized = {
        type: input.type,
        source,
        rating: input.rating ?? null,
        message: normalizeText(input.message),
        quality: normalizeText(input.quality),
        category: normalizeText(input.category),
        qrCodeId,
        productId,
    };
    pruneDuplicateSubmissionCache();
    const fingerprint = submissionFingerprint(request, normalized);
    const cached = duplicateSubmissionCache.get(fingerprint);
    if (cached && cached.expiresAt > Date.now()) {
        return cached;
    }
    const recent = await prisma.feedback.findMany({
        where: {
            source,
            productId,
            qrCodeId,
            rating: normalized.rating,
            message: normalized.message,
            quality: normalized.quality,
            category: normalized.category,
            submittedAt: { gte: new Date(Date.now() - duplicateSubmissionWindowMs) },
        },
        include: {
            question: { select: { id: true } },
            compliment: { select: { id: true } },
            complaint: { select: { id: true } },
        },
        orderBy: { submittedAt: 'desc' },
        take: 5,
    });
    const match = recent.find((item) => feedbackTypeOf(item) === input.type);
    if (!match)
        return null;
    const duplicate = {
        feedbackId: match.id,
        status: match.status,
        expiresAt: Date.now() + duplicateSubmissionWindowMs,
    };
    duplicateSubmissionCache.set(fingerprint, duplicate);
    return duplicate;
}
