import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { feedbackSchema } from '../validators/feedback-validator.js';
import { getUploadRootDir } from '../utils/upload-paths.js';
export const feedbackRoutes = Router();
const upload = multer({ dest: path.join(getUploadRootDir(), 'feedback') });
const toPublicUploadPath = (value) => (value ? `/uploads/feedback/${path.basename(value)}` : null);
async function submitFeedback(request, response, next) {
    try {
        const input = feedbackSchema.parse({
            ...request.body,
            type: resolveSubmissionType(request.baseUrl, request.body.type),
        });
        const qr = input.qrToken
            ? await prisma.qRCode.findUnique({
                where: { code: input.qrToken },
                select: { id: true, productId: true, batchId: true },
            })
            : null;
        if (input.qrToken && !qr) {
            return response.status(404).json({ error: 'QR code not found' });
        }
        const created = await prisma.feedback.create({
            data: {
                rating: input.rating,
                message: input.message ?? null,
                imageUrl: toPublicUploadPath(request.file?.path),
                quality: input.quality ?? null,
                category: input.category ?? null,
                status: 'new',
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
        const limit = Math.min(100, Math.max(1, Number(request.query.limit) || 20));
        const offset = (page - 1) * limit;
        const [items, total] = await Promise.all([
            prisma.feedback.findMany({
                take: limit,
                skip: offset,
                orderBy: { submittedAt: 'desc' },
                include: {
                    product: { select: { name: true } },
                    question: { select: { id: true } },
                    compliment: { select: { id: true } },
                    complaint: { select: { id: true } },
                },
            }),
            prisma.feedback.count(),
        ]);
        response.json({
            items: items.map((f) => ({
                id: f.id,
                rating: f.rating,
                message: f.message,
                imageUrl: f.imageUrl,
                quality: f.quality,
                category: f.category,
                status: f.status,
                submittedAt: f.submittedAt,
                productName: f.product?.name ?? null,
                type: f.question ? 'question' : f.compliment ? 'compliment' : f.complaint ? 'complaint' : 'feedback',
            })),
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
