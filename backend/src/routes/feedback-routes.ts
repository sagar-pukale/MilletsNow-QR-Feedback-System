import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'
import multer from 'multer'
import { createHash } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { attachOptionalAuth, requireAuth, type AuthRequest } from '../middleware/auth.js'
import { FeedbackImageError, uploadFeedbackImage } from '../services/feedback-image-service.js'
import { parseUserAgent, sanitizeAccuracy, sanitizeCoordinate } from '../services/feedback-submission-metadata-service.js'
import { feedbackSchema } from '../validators/feedback-validator.js'

export const feedbackRoutes = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype)) {
      callback(null, true)
      return
    }
    callback(new FeedbackImageError('Only PNG, JPG, JPEG, and WEBP images are allowed.', 400))
  },
})
const duplicateSubmissionWindowMs = 10_000
const duplicateSubmissionCache = new Map<string, { feedbackId: string; status: string; expiresAt: number }>()

type FeedbackWithProduct = Prisma.FeedbackGetPayload<{
  include: {
    product: { select: { name: true } }
    question: { select: { id: true } }
    compliment: { select: { id: true } }
    complaint: { select: { id: true } }
  }
}>

type UploadRequest = AuthRequest & { file?: Express.Multer.File }

async function submitFeedback(request: UploadRequest, response: Response, next: NextFunction) {
  try {
    const input = feedbackSchema.parse({
      ...request.body,
      type: resolveSubmissionType(request.baseUrl, request.body.type),
    })
    const source = input.source === 'common_qr' ? 'common_qr' : 'product_qr'
    const qr = input.qrToken
      ? await prisma.qRCode.findUnique({
          where: { code: input.qrToken },
          select: { id: true, productId: true, batchId: true },
        })
      : null

    if (input.qrToken && !qr) {
      return response.status(404).json({ error: 'QR code not found' })
    }

    const duplicate = await findRecentDuplicateSubmission({
      request,
      input,
      source,
      qrCodeId: qr?.id ?? null,
      productId: qr?.productId ?? null,
    })
    if (duplicate) {
      return response.status(409).json({
        error: 'Duplicate submission detected. Please wait before submitting again.',
        code: 'duplicate_submission',
        id: duplicate.feedbackId,
        status: duplicate.status,
      })
    }

    const imageUrl = await uploadFeedbackImage(request.file)
    const submittedAt = new Date()
    const userAgent = request.get('user-agent') ?? null
    const parsedUserAgent = parseUserAgent(userAgent)
    const resolvedEmail = request.user?.email ?? input.email ?? null
    const resolvedName = (request.user?.fullName?.trim() || input.name) ?? null
    const latitude = sanitizeCoordinate(input.latitude)
    const longitude = sanitizeCoordinate(input.longitude)
    const locationAccuracy = sanitizeAccuracy(input.locationAccuracy)
    const customerId = await resolveCustomerId({
      email: resolvedEmail,
      fullName: resolvedName,
    })

    const created = await prisma.feedback.create({
      data: {
        customerId,
        email: resolvedEmail,
        rating: input.rating,
        message: input.message ?? null,
        imageUrl,
        quality: input.quality ?? null,
        category: input.category ?? null,
        latitude,
        longitude,
        locationAccuracy,
        locationAddress: null,
        submittedAt,
        userAgent,
        deviceType: parsedUserAgent.deviceType,
        operatingSystem: parsedUserAgent.operatingSystem,
        browser: parsedUserAgent.browser,
        status: 'new',
        source,
        ...(qr ? { productId: qr.productId, batchId: qr.batchId, qrCodeId: qr.id } : {}),
        ...(input.type === 'question' && input.message ? { question: { create: { question: input.message } } } : {}),
        ...(input.type === 'compliment'
          ? { compliment: { create: { message: input.message ?? 'Customer compliment submitted' } } }
          : {}),
        ...(input.type === 'complaint'
          ? { complaint: { create: { severity: 1, resolutionNotes: input.category ?? input.message ?? 'Customer complaint submitted' } } }
          : {}),
      },
    })

    rememberSubmissionFingerprint(
      request,
      {
        type: input.type,
        source,
        rating: input.rating ?? null,
        message: normalizeText(input.message),
        quality: normalizeText(input.quality),
        category: normalizeText(input.category),
        qrCodeId: qr?.id ?? null,
        productId: qr?.productId ?? null,
      },
      created,
    )

    response.status(201).json({ id: created.id, status: created.status })
  } catch (error) {
    next(error)
  }
}

function handleFeedbackUpload(fieldName: string) {
  const middleware = upload.single(fieldName)
  return (request: Parameters<typeof middleware>[0], response: Parameters<typeof middleware>[1], next: Parameters<typeof middleware>[2]) => {
    middleware(request, response, (error) => {
      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        next(new FeedbackImageError('Feedback image must be 10 MB or smaller.', 400))
        return
      }
      next(error)
    })
  }
}

feedbackRoutes.post('/', attachOptionalAuth, handleFeedbackUpload('image'), submitFeedback)

feedbackRoutes.get('/', requireAuth, async (request, response, next) => {
  try {
    const page = Math.max(1, Number(request.query.page) || 1)
    const limit = Math.min(1000, Math.max(1, Number(request.query.limit) || 20))
    const offset = (page - 1) * limit

    type FeedbackRow = {
      id: string
      rating: number | null
      message: string | null
      image_url: string | null
      quality: string | null
      category: string | null
      status: string
      source: string
      submitted_at: Date
      email: string | null
      customer_name: string | null
      latitude: number | null
      longitude: number | null
      location_accuracy: number | null
      location_address: string | null
      user_agent: string | null
      device_type: string | null
      operating_system: string | null
      browser: string | null
      product_name: string | null
      type: string
    }

    type SummaryRow = {
      total: bigint | number
      average_rating: number | null
      common_qr_total?: bigint | number
      with_location?: bigint | number
      without_location?: bigint | number
      today_total?: bigint | number
    }

    type DistributionRow = {
      rating: number
      count: bigint | number
    }

    const [items, totalRow, summaryRow, commonQrRow, locationSummaryRow, distributionRows] = await Promise.all([
      prisma.$queryRawUnsafe<FeedbackRow[]>(`
        SELECT
          f.id,
          f.rating,
          f.message,
          f.image_url,
          f.quality,
          f.category,
          f.status::text AS status,
          f.source,
          f.submitted_at,
          f.email,
          customer.full_name AS customer_name,
          f.latitude,
          f.longitude,
          f.location_accuracy,
          f.location_address,
          f.user_agent,
          f.device_type,
          f.operating_system,
          f.browser,
          p.name AS product_name,
          CASE
            WHEN q.feedback_id IS NOT NULL THEN 'question'
            WHEN c.feedback_id IS NOT NULL THEN 'compliment'
            WHEN cp.feedback_id IS NOT NULL THEN 'complaint'
            ELSE 'feedback'
          END AS type
        FROM feedback f
        LEFT JOIN products p ON p.id = f.product_id
        LEFT JOIN customers customer ON customer.id = f.customer_id
        LEFT JOIN questions q ON q.feedback_id = f.id
        LEFT JOIN compliments c ON c.feedback_id = f.id
        LEFT JOIN complaints cp ON cp.feedback_id = f.id
        ORDER BY f.submitted_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `),
      prisma.$queryRawUnsafe<SummaryRow[]>(`SELECT COUNT(*) AS total FROM feedback`),
      prisma.$queryRawUnsafe<SummaryRow[]>(`
        SELECT
          COUNT(*) AS total,
          ROUND(AVG(rating)::numeric, 1) AS average_rating
        FROM feedback
        WHERE rating IS NOT NULL
      `),
      prisma.$queryRawUnsafe<SummaryRow[]>(`
        SELECT COUNT(*) AS common_qr_total
        FROM feedback
        WHERE source = 'common_qr'
      `),
      prisma.$queryRawUnsafe<SummaryRow[]>(`
        SELECT
          COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) AS with_location,
          COUNT(*) FILTER (WHERE latitude IS NULL OR longitude IS NULL) AS without_location,
          COUNT(*) FILTER (
            WHERE submitted_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata'
              AND submitted_at < (date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') + interval '1 day') AT TIME ZONE 'Asia/Kolkata'
          ) AS today_total
        FROM feedback
      `),
      prisma.$queryRawUnsafe<DistributionRow[]>(`
        SELECT rating, COUNT(*) AS count
        FROM feedback
        WHERE rating IS NOT NULL
        GROUP BY rating
        ORDER BY rating DESC
      `),
    ])

    const total = Number(totalRow[0]?.total ?? 0)
    const ratedTotal = Number(summaryRow[0]?.total ?? 0)
    const averageRating = summaryRow[0]?.average_rating != null ? Number(summaryRow[0].average_rating) : null
    const commonQrTotal = Number(commonQrRow[0]?.common_qr_total ?? 0)
    const withLocation = Number(locationSummaryRow[0]?.with_location ?? 0)
    const withoutLocation = Number(locationSummaryRow[0]?.without_location ?? 0)
    const todayTotal = Number(locationSummaryRow[0]?.today_total ?? 0)
    const distributionMap = new Map(distributionRows.map((row) => [row.rating, Number(row.count)]))

    response.json({
      items: items.map((f) => ({
        id: f.id,
        name: f.customer_name,
        email: f.email,
        rating: f.rating,
        message: f.message,
        imageUrl: f.image_url,
        quality: f.quality,
        category: f.category,
        status: f.status,
        submittedAt: f.submitted_at,
        source: f.source,
        latitude: f.latitude,
        longitude: f.longitude,
        locationAccuracy: f.location_accuracy,
        locationAddress: f.location_address,
        userAgent: f.user_agent,
        deviceType: f.device_type,
        operatingSystem: f.operating_system,
        browser: f.browser,
        productName: f.product_name,
        sourceLabel: f.source === 'common_qr' ? 'Common QR' : f.product_name,
        type: f.type,
      })),
      summary: {
        total,
        totalRatings: ratedTotal,
        commonQrTotal,
        withLocation,
        withoutLocation,
        todayTotal,
        averageRating,
        ratingDistribution: [5, 4, 3, 2, 1].map((rating) => ({
          rating,
          count: distributionMap.get(rating) ?? 0,
        })),
      },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
})

async function resolveCustomerId(input: { email: string | null; fullName: string | null }) {
  if (!input.email && !input.fullName) return null

  if (input.email) {
    const existing = await prisma.customer.findFirst({
      where: { email: input.email },
      select: { id: true, fullName: true },
      orderBy: { createdAt: 'asc' },
    })

    if (existing) {
      if (input.fullName && existing.fullName !== input.fullName) {
        await prisma.customer.update({
          where: { id: existing.id },
          data: { fullName: existing.fullName ?? input.fullName },
        })
      }
      return existing.id
    }
  }

  if (input.fullName) {
    const existing = await prisma.customer.findFirst({
      where: { fullName: input.fullName, email: null },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    })

    if (existing) return existing.id
  }

  const created = await prisma.customer.create({
    data: {
      email: input.email,
      fullName: input.fullName,
    },
    select: { id: true },
  })

  return created.id
}

function resolveSubmissionType(baseUrl: string, submittedType: unknown) {
  if (typeof submittedType === 'string' && submittedType.length) {
    return submittedType
  }

  if (baseUrl.includes('complaint')) return 'complaint'
  if (baseUrl.includes('compliment')) return 'compliment'
  return 'feedback'
}

function normalizeText(value?: string | null) {
  return value?.trim().replace(/\s+/g, ' ') || null
}

function submissionFingerprint(
  request: Pick<Request, 'ip' | 'headers'>,
  input: {
    type: string
    source: string
    rating: number | null
    message: string | null
    quality: string | null
    category: string | null
    qrCodeId: string | null
    productId: string | null
  },
) {
  const payload = JSON.stringify({
    ip: request.ip ?? '',
    userAgent: request.headers['user-agent'] ?? '',
    ...input,
  })
  return createHash('sha256').update(payload).digest('hex')
}

function pruneDuplicateSubmissionCache(now = Date.now()) {
  for (const [key, value] of duplicateSubmissionCache.entries()) {
    if (value.expiresAt <= now) duplicateSubmissionCache.delete(key)
  }
}

function feedbackTypeOf(item: {
  question: { id: string } | null
  compliment: { id: string } | null
  complaint: { id: string } | null
}) {
  if (item.question) return 'question'
  if (item.compliment) return 'compliment'
  if (item.complaint) return 'complaint'
  return 'feedback'
}

function rememberSubmissionFingerprint(
  request: Pick<Request, 'ip' | 'headers'>,
  input: {
    type: string
    source: string
    rating: number | null
    message: string | null
    quality: string | null
    category: string | null
    qrCodeId: string | null
    productId: string | null
  },
  created: { id: string; status: string },
) {
  pruneDuplicateSubmissionCache()
  duplicateSubmissionCache.set(submissionFingerprint(request, input), {
    feedbackId: created.id,
    status: created.status,
    expiresAt: Date.now() + duplicateSubmissionWindowMs,
  })
}

async function findRecentDuplicateSubmission({
  request,
  input,
  source,
  qrCodeId,
  productId,
}: {
  request: Pick<Request, 'ip' | 'headers'>
  input: {
    type: string
    rating?: number
    message?: string
    quality?: string
    category?: string
  }
  source: string
  qrCodeId: string | null
  productId: string | null
}) {
  const normalized = {
    type: input.type,
    source,
    rating: input.rating ?? null,
    message: normalizeText(input.message),
    quality: normalizeText(input.quality),
    category: normalizeText(input.category),
    qrCodeId,
    productId,
  }

  pruneDuplicateSubmissionCache()
  const fingerprint = submissionFingerprint(request, normalized)
  const cached = duplicateSubmissionCache.get(fingerprint)
  if (cached && cached.expiresAt > Date.now()) {
    return cached
  }

  const recent = await prisma.feedback.findMany({
    where: {
      source,
      productId,
      qrCodeId,
      rating: normalized.rating,
      message: normalized.message,
      quality: normalized.quality,
      category: normalized.category,
      submittedAt: { gte: new Date(Date.now() - duplicateSubmissionWindowMs) },
    },
    include: {
      question: { select: { id: true } },
      compliment: { select: { id: true } },
      complaint: { select: { id: true } },
    },
    orderBy: { submittedAt: 'desc' },
    take: 5,
  })

  const match = recent.find((item) => feedbackTypeOf(item) === input.type)
  if (!match) return null

  const duplicate = {
    feedbackId: match.id,
    status: match.status,
    expiresAt: Date.now() + duplicateSubmissionWindowMs,
  }
  duplicateSubmissionCache.set(fingerprint, duplicate)
  return duplicate
}
