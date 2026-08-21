import { PrismaClient } from '@prisma/client'

function getDatasourceUrl() {
  const rawUrl = process.env.DATABASE_URL
  if (!rawUrl) return undefined

  try {
    const url = new URL(rawUrl)
    if (!url.hostname.includes('pooler.supabase.com')) return rawUrl

    const isTransactionPooler = url.port === '6543'

    if (isTransactionPooler && !url.searchParams.has('pgbouncer')) {
      url.searchParams.set('pgbouncer', 'true')
    }

    if (!url.searchParams.has('connection_limit')) {
      url.searchParams.set('connection_limit', '1')
    }

    if (!url.searchParams.has('sslmode')) {
      url.searchParams.set('sslmode', 'require')
    }

    return url.toString()
  } catch {
    return rawUrl
  }
}

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getDatasourceUrl(),
    },
  },
})
