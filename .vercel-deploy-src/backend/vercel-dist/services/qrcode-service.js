"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.qrCodeService = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
const node_crypto_1 = require("node:crypto");
const env_js_1 = require("../config/env.js");
const prisma_js_1 = require("../config/prisma.js");
const include = {
    product: { include: { category: true } },
    batch: true,
    scanLogs: {
        select: {
            scannedAt: true,
        },
        orderBy: {
            scannedAt: 'desc',
        },
    },
};
const publicAppUrl = (env_js_1.env.PUBLIC_APP_URL ?? env_js_1.env.CORS_ORIGIN).replace(/\/+$/, '');
function publicScanUrl(token) {
    return `${publicAppUrl}/scan/${encodeURIComponent(token)}`;
}
function imageFor(token) {
    return qrcode_1.default.toDataURL(publicScanUrl(token), { margin: 1, width: 180 });
}
async function present(record) {
    const lastScan = record.scanLogs[0]?.scannedAt ?? null;
    return {
        id: record.id,
        productId: record.productId,
        productName: record.product.name,
        category: record.product.category?.name ?? null,
        brand: record.product.brand ?? null,
        weight: record.product.weight?.toString() ?? null,
        unit: record.product.unit ?? null,
        batchId: record.batchId,
        batchNumber: record.batch?.batchNumber ?? null,
        qrToken: record.code,
        qrImage: await imageFor(record.code),
        status: record.status === 'revoked' ? 'deactivated' : record.status,
        scanCount: record.scanLogs.length,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        manufacturingDate: record.batch?.manufacturingDate ?? null,
        expiryDate: record.batch?.expiryDate ?? null,
        mrp: record.product.mrp?.toString() ?? null,
        description: record.product.description ?? null,
        imageUrl: record.product.imageUrl ?? null,
        destinationUrl: publicScanUrl(record.code),
        lastScan,
    };
}
exports.qrCodeService = {
    async list(query) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
        const status = query.status === 'deactivated' ? 'revoked' : query.status;
        const where = {
            ...(query.search
                ? {
                    OR: [
                        { code: { contains: query.search, mode: 'insensitive' } },
                        { product: { name: { contains: query.search, mode: 'insensitive' } } },
                    ],
                }
                : {}),
            ...(query.productId ? { productId: query.productId } : {}),
            ...(query.batchId ? { batchId: query.batchId } : {}),
            ...(status ? { status: status } : {}),
        };
        const [rows, total] = await Promise.all([
            prisma_js_1.prisma.qRCode.findMany({
                where,
                include,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma_js_1.prisma.qRCode.count({ where }),
        ]);
        return {
            items: await Promise.all(rows.map((row) => present(row))),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    },
    async get(id) {
        const row = await prisma_js_1.prisma.qRCode.findUnique({ where: { id }, include });
        return row ? present(row) : null;
    },
    async findByToken(code) {
        const row = await prisma_js_1.prisma.qRCode.findUnique({ where: { code }, include });
        return row ? present(row) : null;
    },
    async generate(input) {
        const product = await prisma_js_1.prisma.product.findUnique({
            where: { id: input.productId },
            include: { category: true },
        });
        if (!product)
            throw new Error('Product not found');
        const batch = input.batchId
            ? await prisma_js_1.prisma.productBatch.findFirst({
                where: { id: input.batchId, productId: input.productId },
            })
            : await prisma_js_1.prisma.productBatch.findFirst({
                where: { productId: input.productId },
                orderBy: { createdAt: 'desc' },
            });
        const quantity = Math.min(100, Math.max(1, Number(input.quantity) || 1));
        const created = [];
        for (let index = 0; index < quantity; index += 1) {
            const code = `MN-${product.sku}-${Date.now().toString(36).toUpperCase()}-${(0, node_crypto_1.randomBytes)(3).toString('hex').toUpperCase()}`;
            created.push(await prisma_js_1.prisma.qRCode.create({
                data: {
                    productId: product.id,
                    batchId: batch?.id,
                    code,
                    destinationUrl: publicScanUrl(code),
                },
                include,
            }));
        }
        return Promise.all(created.map((row) => present(row)));
    },
    async recordScan(input) {
        await prisma_js_1.prisma.qRScanLog.create({
            data: {
                qrCodeId: input.qrCodeId,
                ipAddress: input.ipAddress ?? null,
                userAgent: input.userAgent ?? null,
                deviceType: input.deviceType ?? null,
            },
        });
    },
    async remove(id) {
        try {
            await prisma_js_1.prisma.qRCode.delete({ where: { id } });
            return true;
        }
        catch {
            return false;
        }
    },
    async setStatus(id, status) {
        const row = await prisma_js_1.prisma.qRCode.update({
            where: { id },
            data: { status: status === 'deactivated' ? 'revoked' : 'active' },
            include,
        });
        return present(row);
    },
};
