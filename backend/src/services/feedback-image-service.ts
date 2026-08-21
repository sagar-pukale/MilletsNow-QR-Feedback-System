import { randomUUID } from 'node:crypto'

import { getSupabaseClient, getSupabaseStoragePublicUrl, supabaseStorageBucket } from '../config/supabase.js'

const allowedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp'])
const maxFileSizeBytes = 10 * 1024 * 1024

export class FeedbackImageError extends Error {
  statusCode: number

  constructor(message: string, statusCode = 400) {
    super(message)
    this.name = 'FeedbackImageError'
    this.statusCode = statusCode
  }
}

export function validateFeedbackImageFile(file?: Express.Multer.File | null) {
  if (!file) return
  if (!allowedMimeTypes.has(file.mimetype)) {
    throw new FeedbackImageError('Only PNG, JPG, JPEG, and WEBP images are allowed.', 400)
  }
  if (file.size > maxFileSizeBytes) {
    throw new FeedbackImageError('Feedback image must be 10 MB or smaller.', 400)
  }
}

function sanitizedBaseName(originalname: string) {
  const trimmed = originalname.trim().toLowerCase()
  const ext = mimeExtension(trimmed) ?? 'jpg'
  const stem = trimmed
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${stem || 'feedback-image'}.${ext}`
}

function mimeExtension(originalname: string) {
  const match = originalname.match(/\.([a-z0-9]+)$/i)
  const ext = match?.[1]?.toLowerCase()
  if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'webp') return ext === 'jpeg' ? 'jpg' : ext
  return null
}

export async function uploadFeedbackImage(file?: Express.Multer.File | null) {
  validateFeedbackImageFile(file)
  if (!file) return null

  const timestamp = Date.now()
  const uniqueName = `${timestamp}-${randomUUID()}-${sanitizedBaseName(file.originalname)}`
  const path = `feedback/${uniqueName}`
  const { error } = await getSupabaseClient().storage.from(supabaseStorageBucket).upload(path, file.buffer, {
    cacheControl: '3600',
    contentType: file.mimetype,
    upsert: false,
  })

  if (error) {
    throw new FeedbackImageError(`Supabase upload failed: ${error.message}`, 502)
  }

  return getSupabaseStoragePublicUrl(path)
}
