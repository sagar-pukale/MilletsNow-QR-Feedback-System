import type { Request } from 'express'

import { env } from '../config/env.js'

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

function originFromReferer(value?: string | null) {
  if (!value) return ''

  try {
    return new URL(value).origin
  } catch {
    return ''
  }
}

export function configuredPublicAppUrl() {
  return normalizeUrl(env.PUBLIC_APP_URL ?? env.CORS_ORIGIN)
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
