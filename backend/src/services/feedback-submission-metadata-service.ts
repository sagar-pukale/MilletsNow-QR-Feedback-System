type ParsedUserAgent = {
  browser: string | null
  operatingSystem: string | null
  deviceType: string | null
}

function matchFirst(source: string, patterns: Array<[RegExp, string]>) {
  for (const [pattern, label] of patterns) {
    if (pattern.test(source)) return label
  }
  return null
}

export function parseUserAgent(userAgent: string | null | undefined): ParsedUserAgent {
  const normalized = (userAgent ?? '').trim()
  if (!normalized) {
    return {
      browser: null,
      operatingSystem: null,
      deviceType: null,
    }
  }

  const browser = matchFirst(normalized, [
    [/\bEdg\//i, 'Edge'],
    [/\bOPR\//i, 'Opera'],
    [/\bChrome\//i, 'Chrome'],
    [/\bFirefox\//i, 'Firefox'],
    [/\bVersion\/[\d.]+.*Safari\//i, 'Safari'],
    [/\bSamsungBrowser\//i, 'Samsung Internet'],
  ])

  const operatingSystem = matchFirst(normalized, [
    [/\bWindows NT\b/i, 'Windows'],
    [/\bAndroid\b/i, 'Android'],
    [/\biPhone\b|\biPad\b|\biOS\b/i, 'iOS'],
    [/\bMac OS X\b|\bMacintosh\b/i, 'macOS'],
    [/\bLinux\b/i, 'Linux'],
  ])

  const deviceType =
    /\biPad\b/i.test(normalized) ? 'tablet' :
    /\bMobi\b|\bAndroid\b|\biPhone\b/i.test(normalized) ? 'mobile' :
    /\bTablet\b/i.test(normalized) ? 'tablet' :
    'desktop'

  return {
    browser,
    operatingSystem,
    deviceType,
  }
}

export function sanitizeCoordinate(value: number | undefined) {
  if (value == null || Number.isNaN(value)) return null
  return Number(value.toFixed(6))
}

export function sanitizeAccuracy(value: number | undefined) {
  if (value == null || Number.isNaN(value)) return null
  return Math.round(value * 100) / 100
}
