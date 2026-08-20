const productionApiFallback = 'https://milletsnow-qr-feedback-system.onrender.com'

function normalizeBaseUrl(value?: string) {
  return (value ?? '').trim().replace(/\/+$/, '')
}

const configuredApiUrl = normalizeBaseUrl(import.meta.env.VITE_API_URL)
const resolvedApiUrl = configuredApiUrl || (import.meta.env.PROD ? productionApiFallback : '')
const configuredAppUrl = normalizeBaseUrl(import.meta.env.VITE_APP_URL)

function browserOrigin() {
  if (typeof window === 'undefined') return ''
  return normalizeBaseUrl(window.location.origin)
}

function withLeadingSlash(value: string) {
  return value.startsWith('/') ? value : `/${value}`
}

export function apiPath(path: string) {
  const normalized = withLeadingSlash(path)
  return `${resolvedApiUrl}/api${normalized}`
}

export function assetUrl(value?: string | null) {
  if (!value) return ''
  if (value.startsWith('http') || value.startsWith('data:')) return value
  return `${resolvedApiUrl}/${value.replace(/^\/+/, '')}`
}

export function appPath(path: string) {
  const normalized = withLeadingSlash(path)
  const appBaseUrl = configuredAppUrl || browserOrigin() || resolvedApiUrl
  return `${appBaseUrl}${normalized}`
}
