import { Router } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { feedbackSchema } from '../validators/feedback-validator.js'

export const feedbackRoutes = Router()

type FeedbackWithProduct = Prisma.FeedbackGetPayload<{
  include: {
    product: { select: { name: true } }
    question: { select: { id: true } }
    compliment: { select: { id: true } }
    complaint: { select: { id: true } }
  }
}>

feedbackRoutes.post('/', async (request, response, next) => {
  try {
    const input = feedbackSchema.parse(request.body)
    const qr = input.qrToken
      ? await prisma.qRCode.findUnique({
          where: { code: input.qrToken },
          select: { id: true, productId: true, batchId: true },
        })
      : null

    if (input.qrToken && !qr) {
      return response.status(404).json({ error: 'QR code not found' })
    }

    const created = await prisma.feedback.create({
      data: {
        rating: input.rating,
        message: input.message,
        status: 'new',
        ...(qr ? { productId: qr.productId, batchId: qr.batchId, qrCodeId: qr.id } : {}),
        ...(input.type === 'question' ? { question: { create: { question: input.message } } } : {}),
        ...(input.type === 'compliment' ? { compliment: { create: { message: input.message } } } : {}),
        ...(input.type === 'complaint' ? { complaint: { create: { severity: 1, resolutionNotes: input.message } } } : {}),
      },
    })

    response.status(201).json({ id: created.id, status: created.status })
  } catch (error) {
    next(error)
  }
})

feedbackRoutes.get('/', requireAuth, async (request, response, next) => {
  try {
    const page = Math.max(1, Number(request.query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(request.query.limit) || 20))
    const offset = (page - 1) * limit

    const [items, total] = await Promise.all([
      prisma.feedback.findMany({
        take: limit,
        skip: offset,
        orderBy: { submittedAt: 'desc' },
        include: {
          product: { select: { name: true } },
          question: { select: { id: true } },
          compliment: { select: { id: true } },
          complaint: { select: { id: true } },
        },
      }),
      prisma.feedback.count(),
    ])

    response.json({
      items: items.map((f: FeedbackWithProduct) => ({
        id: f.id,
        rating: f.rating,
        message: f.message,
        status: f.status,
        submittedAt: f.submittedAt,
        productName: f.product?.name ?? null,
        type: f.question ? 'question' : f.compliment ? 'compliment' : f.complaint ? 'complaint' : 'feedback',
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
})
