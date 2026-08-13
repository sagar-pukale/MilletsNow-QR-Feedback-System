import { productRepository } from '../repositories/product-repository.js';
import { productCreateSchema, productIdSchema, productUpdateSchema } from '../validators/product-validator.js';
import { prisma } from '../config/prisma.js';
import { AppError, extractStoragePathFromPublicUrl, removeProductImage, uploadProductImage } from './product-image-service.js';
export const productService = {
    async list(query) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
        const [items, total] = await productRepository.list({ skip: (page - 1) * limit, take: limit, search: query.search, categoryId: query.categoryId, isActive: query.status ? query.status === 'active' : undefined });
        return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    },
    get(id) {
        return productRepository.findById(productIdSchema.parse(id));
    },
    async create(input, imageFile) {
        const data = productCreateSchema.parse(input);
        const { manufacturingDate, expiryDate, batchNumber, quantity, categoryId, categoryName, ...product } = data;
        const created = await prisma.$transaction(async (transaction) => {
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
        const uploaded = await uploadProductImage(created.id, imageFile);
        try {
            return await productRepository.update(created.id, { imageUrl: uploaded.publicUrl });
        }
        catch (error) {
            await removeProductImage(uploaded.path);
            throw error;
        }
    },
    async update(id, input, imageFile) {
        const productId = productIdSchema.parse(id);
        const data = productUpdateSchema.parse(input);
        const { manufacturingDate, expiryDate, batchNumber, quantity, categoryId, categoryName, ...product } = data;
        let uploadedPath = null;
        let previousImagePath = null;
        if (imageFile) {
            const existing = await productRepository.findById(productId);
            if (!existing)
                throw new AppError('Product not found', 404);
            previousImagePath = extractStoragePathFromPublicUrl(existing.imageUrl);
            const uploaded = await uploadProductImage(productId, imageFile);
            uploadedPath = uploaded.path;
            product.imageUrl = uploaded.publicUrl;
        }
        try {
            const updated = await prisma.$transaction(async (transaction) => {
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
                await removeProductImage(previousImagePath);
            }
            return updated;
        }
        catch (error) {
            if (uploadedPath)
                await removeProductImage(uploadedPath);
            throw error;
        }
    },
    async uploadImage(id, file) {
        const productId = productIdSchema.parse(id);
        const existing = await productRepository.findById(productId);
        if (!existing)
            throw new AppError('Product not found', 404);
        const previousImagePath = extractStoragePathFromPublicUrl(existing.imageUrl);
        const uploaded = await uploadProductImage(productId, file);
        try {
            const updated = await productRepository.update(productId, { imageUrl: uploaded.publicUrl });
            if (previousImagePath && previousImagePath !== uploaded.path) {
                await removeProductImage(previousImagePath);
            }
            return updated;
        }
        catch (error) {
            await removeProductImage(uploaded.path);
            throw error;
        }
    },
    remove(id) {
        return productRepository.remove(productIdSchema.parse(id));
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
