const productionApiFallback = 'https://milletsnow-qr-feedback-system.onrender.com'
const authTokenStorageKey = 'milletsnow_admin_token'

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

function browserStorage() {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

export function getStoredAuthToken() {
  return browserStorage()?.getItem(authTokenStorageKey) ?? ''
}

export function setStoredAuthToken(token?: string | null) {
  const storage = browserStorage()
  if (!storage) return
  if (!token) {
    storage.removeItem(authTokenStorageKey)
    return
  }
  storage.setItem(authTokenStorageKey, token)
}

export function clearStoredAuthToken() {
  browserStorage()?.removeItem(authTokenStorageKey)
}

export function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  const token = getStoredAuthToken()
  const method = (init.method ?? 'GET').toUpperCase()

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if ((method === 'GET' || method === 'HEAD') && !headers.has('Cache-Control')) {
    headers.set('Cache-Control', 'no-store')
  }

  return fetch(apiPath(path), {
    ...init,
    cache: init.cache ?? (method === 'GET' || method === 'HEAD' ? 'no-store' : undefined),
    credentials: 'include',
    headers,
  })
}

export function assetUrl(value?: string | null) {
  if (!value) return ''
  if (value.startsWith('http') || value.startsWith('data:')) return value
  const normalized = value.replace(/^\/+/, '')
  return resolvedApiUrl ? `${resolvedApiUrl}/${normalized}` : `/${normalized}`
}

export function appPath(path: string) {
  const normalized = withLeadingSlash(path)
  const appBaseUrl = configuredAppUrl || browserOrigin() || resolvedApiUrl
  return `${appBaseUrl}${normalized}`
}
