"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productService = void 0;
const product_repository_js_1 = require("../repositories/product-repository.js");
const product_validator_js_1 = require("../validators/product-validator.js");
const prisma_js_1 = require("../config/prisma.js");
exports.productService = {
    async list(query) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
        const [items, total] = await product_repository_js_1.productRepository.list({ skip: (page - 1) * limit, take: limit, search: query.search, categoryId: query.categoryId, isActive: query.status ? query.status === 'active' : undefined });
        return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    },
    get(id) {
        return product_repository_js_1.productRepository.findById(product_validator_js_1.productIdSchema.parse(id));
    },
    create(input) {
        const data = product_validator_js_1.productCreateSchema.parse(input);
        const { manufacturingDate, expiryDate, batchNumber, quantity, categoryId, ...product } = data;
        return product_repository_js_1.productRepository.create({
            ...product,
            slug: `${product.name}-${product.sku}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
            ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
            ...(batchNumber ? { batches: { create: { batchNumber, manufacturingDate, expiryDate, quantity } } } : {}),
        });
    },
    update(id, input) {
        const productId = product_validator_js_1.productIdSchema.parse(id);
        const data = product_validator_js_1.productUpdateSchema.parse(input);
        const { manufacturingDate, expiryDate, batchNumber, quantity, categoryId, categoryName: _categoryName, ...product } = data;
        return prisma_js_1.prisma.$transaction(async (transaction) => {
            await transaction.product.update({ where: { id: productId }, data: { ...product, ...(categoryId !== undefined ? { categoryId } : {}) } });
            if (batchNumber || manufacturingDate || expiryDate || quantity !== undefined) {
                const existing = await transaction.productBatch.findFirst({ where: { productId }, orderBy: { createdAt: 'desc' } });
                if (existing)
                    await transaction.productBatch.update({ where: { id: existing.id }, data: { ...(batchNumber ? { batchNumber } : {}), ...(manufacturingDate !== undefined ? { manufacturingDate } : {}), ...(expiryDate !== undefined ? { expiryDate } : {}), ...(quantity !== undefined ? { quantity } : {}) } });
                else if (batchNumber)
                    await transaction.productBatch.create({ data: { productId, batchNumber, manufacturingDate, expiryDate, quantity: quantity ?? 0 } });
            }
            return transaction.product.findUnique({ where: { id: productId }, include: { category: true, batches: true, _count: { select: { qrCodes: true } } } });
        });
    },
    remove(id) {
        return product_repository_js_1.productRepository.remove(product_validator_js_1.productIdSchema.parse(id));
    },
};
