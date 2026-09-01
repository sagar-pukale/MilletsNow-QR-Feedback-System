import type { Request } from 'express'

import { env } from '../config/env.js'

const canonicalProductionPublicAppUrl = 'https://milletsnow-qr-feedback-system.onrender.com'

function normalizeUrl(value?: string | null) {
  return (value ?? '').trim().replace(/\/+$/, '')
}

function isPublicWebOrigin(value: string) {
  if (!value) return false

  try {
    const url = new URL(value)
    return /^https?:$/i.test(url.protocol) && !/^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(url.hostname)
  } catch {
    return false
  }
}

function canonicalizeConfiguredPublicUrl(value?: string | null) {
  const normalized = normalizeUrl(value)
  if (!normalized) return normalized

  try {
    const url = new URL(normalized)
    if (
      env.NODE_ENV === 'production' &&
      (/millets-now-qr-feedback-system\.vercel\.app$/i.test(url.hostname) ||
        /milletsnow-qr-feedback-system-1\.onrender\.com$/i.test(url.hostname))
    ) {
      return canonicalProductionPublicAppUrl
    }
  } catch {
    return normalized
  }

  return normalized
}

function originFromReferer(value?: string | null) {
  if (!value) return ''

  try {
    return new URL(value).origin
  } catch {
    return ''
  }
}

export function configuredPublicAppUrl() {
  return canonicalizeConfiguredPublicUrl(env.PUBLIC_APP_URL ?? env.CORS_ORIGIN) || canonicalProductionPublicAppUrl
}

export function resolvePublicAppUrl(request?: Request) {
  const configuredUrl = configuredPublicAppUrl()
  const candidates = [
    configuredUrl,
    normalizeUrl(request?.get('origin')),
    normalizeUrl(originFromReferer(request?.get('referer'))),
  ]

  for (const candidate of candidates) {
    if (isPublicWebOrigin(candidate)) return candidate
  }

  return configuredUrl
}

export function buildPublicScanUrl(publicAppUrl: string, token: string) {
  return `${normalizeUrl(publicAppUrl)}/scan/${encodeURIComponent(token)}`
}

export function buildPublicCommonScanUrl(publicAppUrl: string) {
  return `${normalizeUrl(publicAppUrl)}/scan`
}
