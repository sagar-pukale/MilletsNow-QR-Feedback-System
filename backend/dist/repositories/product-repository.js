import { prisma } from '../config/prisma.js';
export const productRepository = {
    list({ skip, take, search, categoryId, isActive }) {
        const where = {
            ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { sku: { contains: search, mode: 'insensitive' } }] } : {}),
            ...(categoryId ? { categoryId } : {}),
            ...(isActive === undefined ? {} : { isActive }),
        };
        return Promise.all([
            prisma.product.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { category: true, batches: true, _count: { select: { qrCodes: true } } } }),
            prisma.product.count({ where }),
        ]);
    },
    findById(id) {
        return prisma.product.findUnique({ where: { id }, include: { category: true, batches: true, _count: { select: { qrCodes: true } } } });
    },
    create(data) {
        return prisma.product.create({ data, include: { category: true, batches: true, _count: { select: { qrCodes: true } } } });
    },
    update(id, data) {
        return prisma.product.update({ where: { id }, data, include: { category: true, batches: true, _count: { select: { qrCodes: true } } } });
    },
    remove(id) {
        return prisma.product.delete({ where: { id } });
    },
};
