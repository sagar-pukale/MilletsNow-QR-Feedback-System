"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRepository = void 0;
const prisma_js_1 = require("../config/prisma.js");
exports.productRepository = {
    list({ skip, take, search, categoryId, isActive }) {
        const where = {
            ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { sku: { contains: search, mode: 'insensitive' } }] } : {}),
            ...(categoryId ? { categoryId } : {}),
            ...(isActive === undefined ? {} : { isActive }),
        };
        return Promise.all([
            prisma_js_1.prisma.product.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { category: true, batches: true, _count: { select: { qrCodes: true } } } }),
            prisma_js_1.prisma.product.count({ where }),
        ]);
    },
    findById(id) {
        return prisma_js_1.prisma.product.findUnique({ where: { id }, include: { category: true, batches: true, _count: { select: { qrCodes: true } } } });
    },
    create(data) {
        return prisma_js_1.prisma.product.create({ data, include: { category: true, batches: true, _count: { select: { qrCodes: true } } } });
    },
    update(id, data) {
        return prisma_js_1.prisma.product.update({ where: { id }, data, include: { category: true, batches: true, _count: { select: { qrCodes: true } } } });
    },
    remove(id) {
        return prisma_js_1.prisma.product.delete({ where: { id } });
    },
};
