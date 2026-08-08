import { Router } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { feedbackSchema } from '../validators/feedback-validator.js'

export const feedbackRoutes = Router()
feedbackRoutes.post('/', async (request, response, next) => {
  try {
    const input = feedbackSchema.parse(request.body)
    const qr = input.qrToken ? await prisma.qRCode.findUnique({ where: { code: input.qrToken }, select: { id: true, productId: true, batchId: true } }) : null
    if (input.qrToken && !qr) return response.status(404).json({ error: 'QR code not found' })
    const created = await prisma.feedback.create({ data: { rating: input.rating, message: input.message, status: 'new', ...(input.type === 'question' ? { question: { create: { question: input.message } } } : {}), ...(input.type === 'compliment' ? { compliment: { create: { message: input.message } } } : {}), ...(input.type === 'complaint' ? { complaint: { create: { severity: 1, resolutionNotes: input.message } } } : {}) } })
    if (qr) await prisma.$executeRaw(Prisma.sql`UPDATE feedback SET product_id = ${qr.productId}::uuid, batch_id = ${qr.batchId}::uuid, qr_code_id = ${qr.id}::uuid WHERE id = ${created.id}::uuid`)
    response.status(201).json({ id: created.id, status: created.status })
  } catch (error) { next(error) }
})

feedbackRoutes.get('/', requireAuth, async (request, response, next) => {
  try {
    const page = Math.max(1, Number(request.query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(request.query.limit) || 20))
    const offset = (page - 1) * limit
    const [rows, totals] = await Promise.all([
      prisma.$queryRaw<Array<{ id: string; rating: number | null; message: string | null; status: string; submitted_at: Date; product_name: string | null; type: string }>>(Prisma.sql`SELECT f.id, f.rating, f.message, f.status, f.submitted_at, p.name AS product_name, CASE WHEN q.id IS NOT NULL THEN 'question' WHEN c.id IS NOT NULL THEN 'compliment' WHEN co.id IS NOT NULL THEN 'complaint' ELSE 'feedback' END AS type FROM feedback f LEFT JOIN products p ON p.id = f.product_id LEFT JOIN questions q ON q.feedback_id = f.id LEFT JOIN compliments c ON c.feedback_id = f.id LEFT JOIN complaints co ON co.feedback_id = f.id ORDER BY f.submitted_at DESC LIMIT ${limit} OFFSET ${offset}`),
      prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`SELECT COUNT(*)::bigint AS count FROM feedback`),
    ])
    const total = Number(totals[0]?.count ?? 0n)
    response.json({ items: rows.map((row) => ({ id: row.id, rating: row.rating, message: row.message, status: row.status, submittedAt: row.submitted_at, productName: row.product_name, type: row.type })), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (error) { next(error) }
})
