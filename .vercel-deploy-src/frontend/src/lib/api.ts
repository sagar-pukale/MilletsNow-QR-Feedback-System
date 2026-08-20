const configuredApiUrl = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '')

function withLeadingSlash(value: string) {
  return value.startsWith('/') ? value : `/${value}`
}

export function apiPath(path: string) {
  const normalized = withLeadingSlash(path)
  return `${configuredApiUrl}/api${normalized}`
}

export function assetUrl(value?: string | null) {
  if (!value) return ''
  if (value.startsWith('http') || value.startsWith('data:')) return value
  return `${configuredApiUrl}/${value.replace(/^\/+/, '')}`
}

export function appPath(path: string) {
  const normalized = withLeadingSlash(path)
  return `${configuredApiUrl}${normalized}`
}
