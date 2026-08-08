import { prisma } from '../config/prisma.js'

export const productRepository = {
  list({ skip, take, search, categoryId, isActive }: { skip: number; take: number; search?: string; categoryId?: string; isActive?: boolean }) {
    const where = {
      ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { sku: { contains: search, mode: 'insensitive' as const } }] } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(isActive === undefined ? {} : { isActive }),
    }
    return Promise.all([
      prisma.product.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { category: true, batches: true, _count: { select: { qrCodes: true } } } }),
      prisma.product.count({ where }),
    ])
  },
  findById(id: string) {
    return prisma.product.findUnique({ where: { id }, include: { category: true, batches: true, _count: { select: { qrCodes: true } } } })
  },
  create(data: Parameters<typeof prisma.product.create>[0]['data']) {
    return prisma.product.create({ data, include: { category: true, batches: true, _count: { select: { qrCodes: true } } } })
  },
  update(id: string, data: Parameters<typeof prisma.product.update>[0]['data']) {
    return prisma.product.update({ where: { id }, data, include: { category: true, batches: true, _count: { select: { qrCodes: true } } } })
  },
  remove(id: string) {
    return prisma.product.delete({ where: { id } })
  },
}
