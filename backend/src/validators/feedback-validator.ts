import { z } from 'zod'

const optionalTrimmedString = z
  .string()
  .trim()
  .transform((value) => (value.length ? value : undefined))
  .optional()

const optionalNumber = z.preprocess((value) => {
  if (value === '' || value == null) return undefined
  return value
}, z.coerce.number().finite().optional())

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
    latitude: optionalNumber,
    longitude: optionalNumber,
    locationAccuracy: optionalNumber,
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

    if (value.latitude != null && (value.latitude < -90 || value.latitude > 90)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['latitude'],
        message: 'Latitude must be between -90 and 90.',
      })
    }

    if (value.longitude != null && (value.longitude < -180 || value.longitude > 180)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['longitude'],
        message: 'Longitude must be between -180 and 180.',
      })
    }

    if (value.locationAccuracy != null && value.locationAccuracy < 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['locationAccuracy'],
        message: 'Location accuracy must be zero or greater.',
      })
    }
  })
