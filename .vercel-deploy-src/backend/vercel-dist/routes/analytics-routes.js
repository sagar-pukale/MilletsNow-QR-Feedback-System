"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRoutes = void 0;
const express_1 = require("express");
const prisma_js_1 = require("../config/prisma.js");
exports.analyticsRoutes = (0, express_1.Router)();
function splitDateParts(date) {
    const parts = date.split('-');
    return {
        year: Number(parts[0] ?? 0),
        month: Number(parts[1] ?? 1),
        day: Number(parts[2] ?? 1),
    };
}
function parseDateParam(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
        return null;
    return value;
}
function startOfLocalDateUtc(date, timeZoneOffsetMinutes) {
    const { year, month, day } = splitDateParts(date);
    return new Date(Date.UTC(year, month - 1, day) + timeZoneOffsetMinutes * 60_000);
}
function addDays(date, days) {
    const { year, month, day } = splitDateParts(date);
    const next = new Date(Date.UTC(year, month - 1, day + days));
    const yyyy = next.getUTCFullYear();
    const mm = String(next.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(next.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}
function dayKey(timestamp, timeZoneOffsetMinutes) {
    const local = new Date(timestamp.getTime() - timeZoneOffsetMinutes * 60_000);
    const yyyy = local.getUTCFullYear();
    const mm = String(local.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(local.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}
function dayLabel(date) {
    const { year, month, day } = splitDateParts(date);
    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, day)));
}
function listDays(startDate, endDate) {
    const days = [];
    for (let current = startDate; current <= endDate; current = addDays(current, 1)) {
        days.push(current);
    }
    return days;
}
exports.analyticsRoutes.get('/dashboard', async (request, response, next) => {
    try {
        const startDate = parseDateParam(request.query.startDate);
        const endDate = parseDateParam(request.query.endDate);
        if (!startDate || !endDate) {
            return response.status(400).json({ error: 'startDate and endDate must be provided in YYYY-MM-DD format' });
        }
        const timeZoneOffsetMinutes = Number(request.query.timeZoneOffsetMinutes);
        const safeOffset = Number.isFinite(timeZoneOffsetMinutes) ? timeZoneOffsetMinutes : 0;
        const productId = typeof request.query.productId === 'string' && request.query.productId.length ? request.query.productId : undefined;
        const submittedAtGte = startOfLocalDateUtc(startDate, safeOffset);
        const submittedAtLt = startOfLocalDateUtc(addDays(endDate, 1), safeOffset);
        const feedbackWhere = {
            submittedAt: {
                gte: submittedAtGte,
                lt: submittedAtLt,
            },
            ...(productId ? { productId } : {}),
        };
        const scanWhere = {
            scannedAt: {
                gte: submittedAtGte,
                lt: submittedAtLt,
            },
            ...(productId ? { qrCode: { productId } } : {}),
        };
        const [feedbackRows, scanLogs, products] = await Promise.all([
            prisma_js_1.prisma.feedback.findMany({
                where: feedbackWhere,
                orderBy: { submittedAt: 'asc' },
                select: {
                    id: true,
                    productId: true,
                    qrCodeId: true,
                    customerId: true,
                    status: true,
                    submittedAt: true,
                    product: { select: { name: true } },
                    question: { select: { id: true, answeredAt: true } },
                    compliment: { select: { id: true } },
                    complaint: { select: { id: true, resolvedAt: true } },
                },
            }),
            prisma_js_1.prisma.qRScanLog.findMany({
                where: scanWhere,
                orderBy: { scannedAt: 'asc' },
                select: {
                    id: true,
                    scannedAt: true,
                    customerId: true,
                    qrCodeId: true,
                    qrCode: {
                        select: {
                            productId: true,
                        },
                    },
                },
            }),
            prisma_js_1.prisma.product.findMany({
                where: { isActive: true },
                orderBy: { name: 'asc' },
                select: {
                    id: true,
                    name: true,
                    sku: true,
                },
            }),
        ]);
        const days = listDays(startDate, endDate);
        const series = days.map((date) => ({
            day: dayLabel(date),
            feedback: 0,
            questions: 0,
            compliments: 0,
            complaints: 0,
            totalMessages: 0,
            customers: 0,
            scans: 0,
        }));
        const seriesByDay = new Map(days.map((date, index) => [date, series[index]]));
        let feedbackCount = 0;
        let questionCount = 0;
        let complimentCount = 0;
        let complaintCount = 0;
        let totalMessages = 0;
        let totalResponseMs = 0;
        let responseCount = 0;
        const activeCustomerKeys = new Set();
        const customerKeysByDay = new Map();
        const productMessageMap = new Map();
        for (const row of feedbackRows) {
            const date = dayKey(row.submittedAt, safeOffset);
            const bucket = seriesByDay.get(date);
            if (!bucket)
                continue;
            totalMessages += 1;
            bucket.totalMessages += 1;
            const customerKey = row.customerId ?? row.id;
            activeCustomerKeys.add(customerKey);
            if (!customerKeysByDay.has(date))
                customerKeysByDay.set(date, new Set());
            customerKeysByDay.get(date).add(customerKey);
            const productKey = row.productId ?? `unknown:${row.id}`;
            const productName = row.product?.name ?? 'Unassigned product';
            productMessageMap.set(productKey, {
                name: productName,
                count: (productMessageMap.get(productKey)?.count ?? 0) + 1,
            });
            if (row.question) {
                questionCount += 1;
                bucket.questions += 1;
                if (row.question.answeredAt) {
                    totalResponseMs += row.question.answeredAt.getTime() - row.submittedAt.getTime();
                    responseCount += 1;
                }
                continue;
            }
            if (row.compliment) {
                complimentCount += 1;
                bucket.compliments += 1;
                continue;
            }
            if (row.complaint) {
                complaintCount += 1;
                bucket.complaints += 1;
                if (row.complaint.resolvedAt) {
                    totalResponseMs += row.complaint.resolvedAt.getTime() - row.submittedAt.getTime();
                    responseCount += 1;
                }
                continue;
            }
            feedbackCount += 1;
            bucket.feedback += 1;
        }
        for (const row of scanLogs) {
            const date = dayKey(row.scannedAt, safeOffset);
            const bucket = seriesByDay.get(date);
            if (!bucket)
                continue;
            bucket.scans += 1;
        }
        for (const date of days) {
            const bucket = seriesByDay.get(date);
            if (!bucket)
                continue;
            bucket.customers = customerKeysByDay.get(date)?.size ?? 0;
        }
        const productRanking = Array.from(productMessageMap.values())
            .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
            .slice(0, 5);
        const maxProductCount = productRanking[0]?.count ?? 0;
        response.json({
            filters: {
                startDate,
                endDate,
                productId: productId ?? null,
            },
            cards: {
                feedback: feedbackCount,
                questions: questionCount,
                compliments: complimentCount,
                complaints: complaintCount,
            },
            summary: {
                totalMessages,
                activeCustomers: activeCustomerKeys.size,
                averageResponseTimeHours: responseCount > 0 ? Number((totalResponseMs / responseCount / 3_600_000).toFixed(1)) : null,
                scans: scanLogs.length,
            },
            charts: series,
            productsByMessages: productRanking.map((product, index) => ({
                name: product.name,
                value: maxProductCount > 0 ? Math.max(8, Math.round((product.count / maxProductCount) * 100)) : 0,
                messages: `${product.count} messages`,
                color: ['bg-brand-700', 'bg-emerald-600', 'bg-amber-500', 'bg-blue-600', 'bg-rose-600'][index] ?? 'bg-brand-700',
            })),
            productOptions: products,
        });
    }
    catch (error) {
        next(error);
    }
});
