import https from 'node:https'
import { env } from '../config/env.js'

type ResolvedLocation = {
  locationLabel: string | null
  locationLocality: string | null
  locationDistrict: string | null
  locationState: string | null
  locationAddress: string | null
}

type ReverseResponse = {
  display_name?: string
  address?: Record<string, string | undefined>
}

const reverseGeocodeCache = new Map<string, { expiresAt: number; value: ResolvedLocation }>()
const cacheTtlMs = 1000 * 60 * 60 * 24
const requestTimeoutMs = 2500
const minRequestIntervalMs = 1100
let reverseGeocodeQueue = Promise.resolve()
let lastReverseGeocodeAt = 0

const emptyLocation: ResolvedLocation = {
  locationLabel: null,
  locationLocality: null,
  locationDistrict: null,
  locationState: null,
  locationAddress: null,
}

function pickFirst(values: Array<string | undefined | null>) {
  for (const value of values) {
    const normalized = value?.trim()
    if (normalized) return normalized
  }
  return null
}

function uniqueParts(values: Array<string | null>) {
  const seen = new Set<string>()
  const parts: string[] = []
  for (const value of values) {
    if (!value) continue
    const key = value.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    parts.push(value.trim())
  }
  return parts
}

function buildLocation(address: Record<string, string | undefined> | undefined, displayName: string | undefined): ResolvedLocation {
  const locality = pickFirst([
    address?.village,
    address?.hamlet,
    address?.suburb,
    address?.neighbourhood,
    address?.quarter,
    address?.city_district,
    address?.town,
    address?.municipality,
    address?.city,
  ])

  const district = pickFirst([
    address?.county,
    address?.state_district,
    locality === address?.city ? undefined : address?.city,
    locality === address?.town ? undefined : address?.town,
    locality === address?.municipality ? undefined : address?.municipality,
  ])

  const state = pickFirst([address?.state, address?.region])

  const labelParts = uniqueParts([locality, district, state])
  const locationLabel =
    labelParts.length > 0
      ? labelParts.join(', ')
      : pickFirst([
          address?.city,
          address?.town,
          address?.county,
          address?.state,
          displayName,
        ])

  return {
    locationLabel,
    locationLocality: locality,
    locationDistrict: district,
    locationState: state,
    locationAddress: displayName?.trim() || locationLabel,
  }
}

function cacheKey(latitude: number, longitude: number) {
  return `${latitude.toFixed(4)}:${longitude.toFixed(4)}`
}

function pruneCache(now = Date.now()) {
  for (const [key, value] of reverseGeocodeCache.entries()) {
    if (value.expiresAt <= now) reverseGeocodeCache.delete(key)
  }
}

function reverseGeocoderBaseUrl() {
  return (env.REVERSE_GEOCODER_BASE_URL ?? 'https://nominatim.openstreetmap.org/reverse').replace(/\/+$/, '')
}

function reverseGeocoderUserAgent() {
  const publicUrl = env.PUBLIC_APP_URL ? `; ${env.PUBLIC_APP_URL}` : ''
  const contact = env.REVERSE_GEOCODER_CONTACT ?? env.ADMIN_EMAIL ?? 'admin@milletsnow.com'
  return `MilletsNowQRFeedbackSystem/1.0 (${contact}${publicUrl})`
}

function reverseGeocoderContact() {
  return env.REVERSE_GEOCODER_CONTACT ?? env.ADMIN_EMAIL ?? 'admin@milletsnow.com'
}

async function waitForReverseGeocodeSlot() {
  const now = Date.now()
  const waitMs = Math.max(0, minRequestIntervalMs - (now - lastReverseGeocodeAt))
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs))
  }
  lastReverseGeocodeAt = Date.now()
}

async function fetchReverseResponse(url: URL, headers: Record<string, string>) {
  return new Promise<ReverseResponse | null>((resolve) => {
    const request = https.request(
      url,
      {
        method: 'GET',
        headers,
        timeout: requestTimeoutMs,
      },
      (response) => {
        const chunks: Buffer[] = []

        response.on('data', (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
        })

        response.on('end', () => {
          if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
            resolve(null)
            return
          }

          try {
            const text = Buffer.concat(chunks).toString('utf8')
            resolve(JSON.parse(text) as ReverseResponse)
          } catch {
            resolve(null)
          }
        })
      },
    )

    request.on('timeout', () => {
      request.destroy()
      resolve(null)
    })

    request.on('error', () => {
      resolve(null)
    })

    request.end()
  })
}

export async function reverseGeocodeFeedbackLocation(input: {
  latitude: number | null
  longitude: number | null
  acceptLanguage?: string | null
}) {
  const { latitude, longitude } = input
  if (latitude == null || longitude == null) return emptyLocation

  pruneCache()
  const key = cacheKey(latitude, longitude)
  const cached = reverseGeocodeCache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  const run = async () => {
    try {
      await waitForReverseGeocodeSlot()

      const url = new URL(reverseGeocoderBaseUrl())
      url.searchParams.set('format', 'jsonv2')
      url.searchParams.set('addressdetails', '1')
      url.searchParams.set('layer', 'address')
      url.searchParams.set('zoom', '18')
      url.searchParams.set('lat', String(latitude))
      url.searchParams.set('lon', String(longitude))
      url.searchParams.set('email', reverseGeocoderContact())

      const body = await fetchReverseResponse(url, {
        'accept-language': input.acceptLanguage?.trim() || 'en-IN,en;q=0.9',
        'user-agent': reverseGeocoderUserAgent(),
      })
      if (!body) return emptyLocation
      const resolved = buildLocation(body.address, body.display_name)
      reverseGeocodeCache.set(key, { value: resolved, expiresAt: Date.now() + cacheTtlMs })
      return resolved
    } catch {
      return emptyLocation
    }
  }

  const pending = reverseGeocodeQueue.then(run, run)
  reverseGeocodeQueue = pending.then(() => undefined, () => undefined)
  return pending
}
