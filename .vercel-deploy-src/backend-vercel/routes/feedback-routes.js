"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedbackRoutes = void 0;
const express_1 = require("express");
const prisma_js_1 = require("../config/prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const feedback_validator_js_1 = require("../validators/feedback-validator.js");
exports.feedbackRoutes = (0, express_1.Router)();
exports.feedbackRoutes.post('/', async (request, response, next) => {
    try {
        const input = feedback_validator_js_1.feedbackSchema.parse(request.body);
        const qr = input.qrToken
            ? await prisma_js_1.prisma.qRCode.findUnique({
                where: { code: input.qrToken },
                select: { id: true, productId: true, batchId: true },
            })
            : null;
        if (input.qrToken && !qr) {
            return response.status(404).json({ error: 'QR code not found' });
        }
        const created = await prisma_js_1.prisma.feedback.create({
            data: {
                rating: input.rating,
                message: input.message,
                status: 'new',
                ...(qr ? { productId: qr.productId, batchId: qr.batchId, qrCodeId: qr.id } : {}),
                ...(input.type === 'question' ? { question: { create: { question: input.message } } } : {}),
                ...(input.type === 'compliment' ? { compliment: { create: { message: input.message } } } : {}),
                ...(input.type === 'complaint' ? { complaint: { create: { severity: 1, resolutionNotes: input.message } } } : {}),
            },
        });
        response.status(201).json({ id: created.id, status: created.status });
    }
    catch (error) {
        next(error);
    }
});
exports.feedbackRoutes.get('/', auth_js_1.requireAuth, async (request, response, next) => {
    try {
        const page = Math.max(1, Number(request.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(request.query.limit) || 20));
        const offset = (page - 1) * limit;
        const [items, total] = await Promise.all([
            prisma_js_1.prisma.feedback.findMany({
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
            prisma_js_1.prisma.feedback.count(),
        ]);
        response.json({
            items: items.map((f) => ({
                id: f.id,
                rating: f.rating,
                message: f.message,
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
