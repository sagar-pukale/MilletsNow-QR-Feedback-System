import { z } from 'zod'

const optionalTrimmedString = z
  .string()
  .trim()
  .transform((value) => (value.length ? value : undefined))
  .optional()

export const feedbackSchema = z
  .object({
    type: z.enum(['feedback', 'compliment', 'complaint', 'question']),
    source: z.enum(['product_qr', 'common_qr']).optional(),
    rating: z.coerce.number().int().min(1).max(5).optional(),
    message: optionalTrimmedString,
    name: optionalTrimmedString,
    email: z
      .string()
      .trim()
      .email()
      .optional()
      .or(z.literal('').transform(() => undefined)),
    qrToken: z.string().trim().min(1).optional(),
    quality: optionalTrimmedString,
    category: optionalTrimmedString,
  })
  .superRefine((value, context) => {
    const isCommonQr = value.source === 'common_qr'

    if (!isCommonQr && !value.qrToken) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['qrToken'],
        message: 'QR token is required.',
      })
    }

    if ((value.type === 'feedback' || value.type === 'compliment') && !value.rating) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rating'],
        message: 'Rating is required.',
      })
    }

    if (value.type === 'feedback' && !isCommonQr && !value.quality) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['quality'],
        message: 'Taste / Quality selection is required.',
      })
    }

    if (value.type === 'complaint') {
      if (!value.category) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['category'],
          message: 'Complaint category is required.',
        })
      }

      if (!value.message) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['message'],
          message: 'Complaint description is required.',
        })
      }
    }
  })
