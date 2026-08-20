import QRCode from 'qrcode'
import { randomBytes } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { env } from '../config/env.js'
import { prisma } from '../config/prisma.js'

const include = {
  product: { include: { category: true } },
  batch: true,
  scanLogs: {
    select: {
      scannedAt: true,
    },
    orderBy: {
      scannedAt: 'desc' as const,
    },
  },
} as const

type QRCodeRecord = Prisma.QRCodeGetPayload<{
  include: typeof include
}>

const publicAppUrl = (env.PUBLIC_APP_URL ?? env.CORS_ORIGIN).replace(/\/+$/, '')

function publicScanUrl(token: string) {
  return `${publicAppUrl}/scan/${encodeURIComponent(token)}`
}

function publicCommonScanUrl() {
  return `${publicAppUrl}/scan`
}

function imageFor(token: string) {
  return QRCode.toDataURL(publicScanUrl(token), { margin: 1, width: 180 })
}

function commonImage() {
  return QRCode.toDataURL(publicCommonScanUrl(), { margin: 1, width: 220 })
}

async function present(record: QRCodeRecord) {
  const lastScan = record.scanLogs[0]?.scannedAt ?? null

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
  }
}

export const qrCodeService = {
  async getCommonQr() {
    return {
      id: 'common-qr',
      label: 'Common QR',
      qrToken: 'COMMON_QR',
      qrImage: await commonImage(),
      destinationUrl: publicCommonScanUrl(),
      source: 'common_qr' as const,
    }
  },

  async list(query: { search?: string; productId?: string; batchId?: string; status?: string; page?: string; limit?: string }) {
    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10))
    const status = query.status === 'deactivated' ? 'revoked' : query.status
    const where = {
      ...(query.search
        ? {
            OR: [
              { code: { contains: query.search, mode: 'insensitive' as const } },
              { product: { name: { contains: query.search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
      ...(query.productId ? { productId: query.productId } : {}),
      ...(query.batchId ? { batchId: query.batchId } : {}),
      ...(status ? { status: status as 'active' | 'paused' | 'revoked' } : {}),
    }

    const [rows, total] = await Promise.all([
      prisma.qRCode.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.qRCode.count({ where }),
    ])

    return {
      items: await Promise.all(rows.map((row) => present(row))),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  },

  async get(id: string) {
    const row = await prisma.qRCode.findUnique({ where: { id }, include })
    return row ? present(row) : null
  },

  async findByToken(code: string) {
    const row = await prisma.qRCode.findUnique({ where: { code }, include })
    return row ? present(row) : null
  },

  async generate(input: { productId: string; batchId?: string; quantity?: number }) {
    const product = await prisma.product.findUnique({
      where: { id: input.productId },
      include: { category: true },
    })
    if (!product) throw new Error('Product not found')

    const batch = input.batchId
      ? await prisma.productBatch.findFirst({
          where: { id: input.batchId, productId: input.productId },
        })
      : await prisma.productBatch.findFirst({
          where: { productId: input.productId },
          orderBy: { createdAt: 'desc' },
        })

    const quantity = Math.min(100, Math.max(1, Number(input.quantity) || 1))
    const created = []

    for (let index = 0; index < quantity; index += 1) {
      const code = `MN-${product.sku}-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`
      created.push(
        await prisma.qRCode.create({
          data: {
            productId: product.id,
            batchId: batch?.id,
            code,
            destinationUrl: publicScanUrl(code),
          },
          include,
        }),
      )
    }

    return Promise.all(created.map((row) => present(row)))
  },

  async recordScan(input: {
    qrCodeId: string
    ipAddress?: string | null
    userAgent?: string | null
    deviceType?: string | null
  }) {
    await prisma.qRScanLog.create({
      data: {
        qrCodeId: input.qrCodeId,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        deviceType: input.deviceType ?? null,
      },
    })
  },

  async remove(id: string) {
    try {
      await prisma.qRCode.delete({ where: { id } })
      return true
    } catch {
      return false
    }
  },

  async setStatus(id: string, status: 'active' | 'deactivated') {
    const row = await prisma.qRCode.update({
      where: { id },
      data: { status: status === 'deactivated' ? 'revoked' : 'active' },
      include,
    })
    return present(row)
  },
}
