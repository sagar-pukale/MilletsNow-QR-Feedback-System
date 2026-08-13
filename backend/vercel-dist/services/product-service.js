"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productService = void 0;
const product_repository_js_1 = require("../repositories/product-repository.js");
const product_validator_js_1 = require("../validators/product-validator.js");
const prisma_js_1 = require("../config/prisma.js");
const product_image_service_js_1 = require("./product-image-service.js");
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
    async create(input, imageFile) {
        const data = product_validator_js_1.productCreateSchema.parse(input);
        const { manufacturingDate, expiryDate, batchNumber, quantity, categoryId, categoryName, ...product } = data;
        const created = await prisma_js_1.prisma.$transaction(async (transaction) => {
            const resolvedCategoryId = await resolveCategoryId(transaction, categoryId, categoryName);
            return transaction.product.create({
                data: {
                    ...product,
                    slug: `${product.name}-${product.sku}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                    ...(resolvedCategoryId ? { category: { connect: { id: resolvedCategoryId } } } : {}),
                    ...(batchNumber ? { batches: { create: { batchNumber, manufacturingDate, expiryDate, quantity } } } : {}),
                },
                include: { category: true, batches: true, _count: { select: { qrCodes: true } } },
            });
        });
        if (!imageFile)
            return created;
        const uploaded = await (0, product_image_service_js_1.uploadProductImage)(created.id, imageFile);
        try {
            return await product_repository_js_1.productRepository.update(created.id, { imageUrl: uploaded.publicUrl });
        }
        catch (error) {
            await (0, product_image_service_js_1.removeProductImage)(uploaded.path);
            throw error;
        }
    },
    async update(id, input, imageFile) {
        const productId = product_validator_js_1.productIdSchema.parse(id);
        const data = product_validator_js_1.productUpdateSchema.parse(input);
        const { manufacturingDate, expiryDate, batchNumber, quantity, categoryId, categoryName, ...product } = data;
        let uploadedPath = null;
        let previousImagePath = null;
        if (imageFile) {
            const existing = await product_repository_js_1.productRepository.findById(productId);
            if (!existing)
                throw new product_image_service_js_1.AppError('Product not found', 404);
            previousImagePath = (0, product_image_service_js_1.extractStoragePathFromPublicUrl)(existing.imageUrl);
            const uploaded = await (0, product_image_service_js_1.uploadProductImage)(productId, imageFile);
            uploadedPath = uploaded.path;
            product.imageUrl = uploaded.publicUrl;
        }
        try {
            const updated = await prisma_js_1.prisma.$transaction(async (transaction) => {
                const resolvedCategoryId = await resolveCategoryId(transaction, categoryId, categoryName);
                await transaction.product.update({
                    where: { id: productId },
                    data: {
                        ...product,
                        ...(resolvedCategoryId !== undefined ? { categoryId: resolvedCategoryId } : {}),
                    },
                });
                if (batchNumber || manufacturingDate || expiryDate || quantity !== undefined) {
                    const existing = await transaction.productBatch.findFirst({ where: { productId }, orderBy: { createdAt: 'desc' } });
                    if (existing)
                        await transaction.productBatch.update({ where: { id: existing.id }, data: { ...(batchNumber ? { batchNumber } : {}), ...(manufacturingDate !== undefined ? { manufacturingDate } : {}), ...(expiryDate !== undefined ? { expiryDate } : {}), ...(quantity !== undefined ? { quantity } : {}) } });
                    else if (batchNumber)
                        await transaction.productBatch.create({ data: { productId, batchNumber, manufacturingDate, expiryDate, quantity: quantity ?? 0 } });
                }
                return transaction.product.findUnique({ where: { id: productId }, include: { category: true, batches: true, _count: { select: { qrCodes: true } } } });
            });
            if (imageFile && previousImagePath && previousImagePath !== uploadedPath) {
                await (0, product_image_service_js_1.removeProductImage)(previousImagePath);
            }
            return updated;
        }
        catch (error) {
            if (uploadedPath)
                await (0, product_image_service_js_1.removeProductImage)(uploadedPath);
            throw error;
        }
    },
    async uploadImage(id, file) {
        const productId = product_validator_js_1.productIdSchema.parse(id);
        const existing = await product_repository_js_1.productRepository.findById(productId);
        if (!existing)
            throw new product_image_service_js_1.AppError('Product not found', 404);
        const previousImagePath = (0, product_image_service_js_1.extractStoragePathFromPublicUrl)(existing.imageUrl);
        const uploaded = await (0, product_image_service_js_1.uploadProductImage)(productId, file);
        try {
            const updated = await product_repository_js_1.productRepository.update(productId, { imageUrl: uploaded.publicUrl });
            if (previousImagePath && previousImagePath !== uploaded.path) {
                await (0, product_image_service_js_1.removeProductImage)(previousImagePath);
            }
            return updated;
        }
        catch (error) {
            await (0, product_image_service_js_1.removeProductImage)(uploaded.path);
            throw error;
        }
    },
    remove(id) {
        return product_repository_js_1.productRepository.remove(product_validator_js_1.productIdSchema.parse(id));
    },
};
async function resolveCategoryId(transaction, categoryId, categoryName) {
    if (categoryId)
        return categoryId;
    if (categoryName === undefined)
        return undefined;
    const normalizedName = categoryName?.trim() ?? '';
    if (!normalizedName)
        return null;
    const slug = normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const category = await transaction.category.upsert({
        where: { slug },
        update: { name: normalizedName },
        create: { name: normalizedName, slug },
        select: { id: true },
    });
    return category.id;
}
