import { Prisma } from '@prisma/client'
import { productRepository } from '../repositories/product-repository.js'
import { productCreateSchema, productIdSchema, productUpdateSchema } from '../validators/product-validator.js'
import { prisma } from '../config/prisma.js'

export const productService = {
  async list(query: { page?: string; limit?: string; search?: string; categoryId?: string; status?: string }) {
    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10))
    const [items, total] = await productRepository.list({ skip: (page - 1) * limit, take: limit, search: query.search, categoryId: query.categoryId, isActive: query.status ? query.status === 'active' : undefined })
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  },
  get(id: string) {
    return productRepository.findById(productIdSchema.parse(id))
  },
  create(input: unknown) {
    const data = productCreateSchema.parse(input)
    const { manufacturingDate, expiryDate, batchNumber, quantity, categoryId, ...product } = data
    return productRepository.create({
      ...product,
      slug: `${product.name}-${product.sku}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
      ...(batchNumber ? { batches: { create: { batchNumber, manufacturingDate, expiryDate, quantity } } } : {}),
    })
  },
  update(id: string, input: unknown) {
    const productId = productIdSchema.parse(id)
    const data = productUpdateSchema.parse(input)
    const { manufacturingDate, expiryDate, batchNumber, quantity, categoryId, categoryName: _categoryName, ...product } = data
    return prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      await transaction.product.update({ where: { id: productId }, data: { ...product, ...(categoryId !== undefined ? { categoryId } : {}) } })
      if (batchNumber || manufacturingDate || expiryDate || quantity !== undefined) {
        const existing = await transaction.productBatch.findFirst({ where: { productId }, orderBy: { createdAt: 'desc' } })
        if (existing) await transaction.productBatch.update({ where: { id: existing.id }, data: { ...(batchNumber ? { batchNumber } : {}), ...(manufacturingDate !== undefined ? { manufacturingDate } : {}), ...(expiryDate !== undefined ? { expiryDate } : {}), ...(quantity !== undefined ? { quantity } : {}) } })
        else if (batchNumber) await transaction.productBatch.create({ data: { productId, batchNumber, manufacturingDate, expiryDate, quantity: quantity ?? 0 } })
      }
      return transaction.product.findUnique({ where: { id: productId }, include: { category: true, batches: true, _count: { select: { qrCodes: true } } } })
    })
  },
  remove(id: string) {
    return productRepository.remove(productIdSchema.parse(id))
  },
}
