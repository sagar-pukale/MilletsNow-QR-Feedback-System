import { randomUUID } from 'node:crypto'

import { getSupabaseClient, getSupabaseStoragePublicUrl, supabaseStorageBucket } from '../config/supabase.js'

const allowedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp'])
const maxFileSizeBytes = 10 * 1024 * 1024

export class AppError extends Error {
  statusCode: number

  constructor(message: string, statusCode = 400) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
  }
}

export function validateProductImageFile(file?: Express.Multer.File | null) {
  if (!file) throw new AppError('Select a PNG, JPG, JPEG, or WEBP image to upload.', 400)
  if (!allowedMimeTypes.has(file.mimetype)) {
    throw new AppError('Only PNG, JPG, JPEG, and WEBP images are allowed.', 400)
  }
  if (file.size > maxFileSizeBytes) {
    throw new AppError('Product image must be 10 MB or smaller.', 400)
  }
}

function sanitizedBaseName(originalname: string) {
  const trimmed = originalname.trim().toLowerCase()
  const ext = mimeExtension(trimmed) ?? 'jpg'
  const stem = trimmed
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${stem || 'product-image'}.${ext}`
}

function mimeExtension(originalname: string) {
  const match = originalname.match(/\.([a-z0-9]+)$/i)
  const ext = match?.[1]?.toLowerCase()
  if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'webp') return ext === 'jpeg' ? 'jpg' : ext
  return null
}

export async function uploadProductImage(productId: string, file: Express.Multer.File) {
  validateProductImageFile(file)

  const timestamp = Date.now()
  const uniqueName = `${timestamp}-${randomUUID()}-${sanitizedBaseName(file.originalname)}`
  const path = `products/${productId}/${uniqueName}`
  const { error } = await getSupabaseClient().storage.from(supabaseStorageBucket).upload(path, file.buffer, {
    cacheControl: '3600',
    contentType: file.mimetype,
    upsert: false,
  })

  if (error) {
    throw new AppError(`Supabase upload failed: ${error.message}`, 502)
  }

  return {
    path,
    publicUrl: getSupabaseStoragePublicUrl(path),
  }
}

export async function removeProductImage(path?: string | null) {
  if (!path) return
  const { error } = await getSupabaseClient().storage.from(supabaseStorageBucket).remove([path])
  if (error) {
    console.error('Failed to remove orphaned product image from Supabase Storage', { path, error })
  }
}

export function extractStoragePathFromPublicUrl(url?: string | null) {
  if (!url) return null

  const marker = `/storage/v1/object/public/${supabaseStorageBucket}/`
  const index = url.indexOf(marker)
  if (index === -1) return null

  return decodeURIComponent(url.slice(index + marker.length))
}
