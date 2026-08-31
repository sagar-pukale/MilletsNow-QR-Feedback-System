import compression from 'compression'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { existsSync } from 'node:fs'
import path from 'node:path'

import { env } from './config/env.js'
import { errorHandler } from './middleware/error-handler.js'
import { notFound } from './middleware/not-found.js'
import { productRoutes } from './routes/product-routes.js'
import { qrCodeRoutes } from './routes/qrcode-routes.js'
import { scanRoutes } from './routes/scan-routes.js'
import { authRoutes } from './routes/auth-routes.js'
import { requireAuth } from './middleware/auth.js'
import { healthRoute } from './routes/health-route.js'
import { feedbackRoutes } from './routes/feedback-routes.js'
import { analyticsRoutes } from './routes/analytics-routes.js'
import { qrStickerTemplateRoutes } from './routes/qr-sticker-template-routes.js'
import { configuredPublicAppUrl } from './utils/public-app-url.js'
import { getFrontendDistDir, getUploadRootDir } from './utils/upload-paths.js'

export const app = express()
const frontendDistDir = getFrontendDistDir()
const hasFrontendBuild = existsSync(frontendDistDir)
const allowedOrigins = new Set([env.CORS_ORIGIN, env.PUBLIC_APP_URL].filter((value): value is string => Boolean(value)))

function isAllowedOrigin(origin: string) {
  if (allowedOrigins.has(origin)) return true
  if (origin.endsWith('.vercel.app')) return true
  if (origin.endsWith('.onrender.com')) return true
  if (origin.includes('localhost')) return true
  if (origin.includes('127.0.0.1')) return true
  return false
}

function normalizeUrl(value?: string | null) {
  return (value ?? '').trim().replace(/\/+$/, '')
}

function requestOrigin(request: express.Request) {
  const forwardedProto = request.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const protocol = forwardedProto || request.protocol
  const host = request.get('x-forwarded-host') || request.get('host')
  return host ? `${protocol}://${host}` : ''
}

app.disable('x-powered-by')
app.use(helmet({ contentSecurityPolicy: false }))

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (isAllowedOrigin(origin)) {
        return callback(null, true)
      }
      return callback(new Error('Origin not allowed by CORS'))
    },
    credentials: true,
  }),
)

app.use(compression())
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(['/uploads', '/api/uploads'], express.static(getUploadRootDir()))

app.use(['/auth', '/api/auth'], authRoutes)
app.use(['/health', '/api/health'], healthRoute)
app.use(['/products', '/api/products', '/qrcodes', '/api/qrcodes', '/analytics', '/api/analytics', '/qr-sticker-templates', '/api/qr-sticker-templates'], requireAuth)
app.use(['/products', '/api/products'], productRoutes)
app.use(['/qrcodes', '/api/qrcodes'], qrCodeRoutes)
app.use(['/analytics', '/api/analytics'], analyticsRoutes)
app.use(['/qr-sticker-templates', '/api/qr-sticker-templates'], qrStickerTemplateRoutes)
app.use('/api/scan', scanRoutes)
app.use(['/feedback', '/api/feedback', '/complaint', '/api/complaint', '/compliment', '/api/compliment'], feedbackRoutes)

app.get(/^\/scan(?:\/.*)?$/, (request, response, next) => {
  if (hasFrontendBuild) return next()

  const publicAppUrl = configuredPublicAppUrl()
  if (!publicAppUrl) return next()

  const currentOrigin = normalizeUrl(requestOrigin(request))
  const targetOrigin = normalizeUrl(publicAppUrl)
  if (!targetOrigin || currentOrigin === targetOrigin) return next()

  const query = request.originalUrl.includes('?') ? request.originalUrl.slice(request.path.length) : ''
  response.redirect(302, `${targetOrigin}${request.path}${query}`)
})

if (hasFrontendBuild) {
  app.use(express.static(frontendDistDir))
  app.get(/^(?!\/(?:auth|api\/auth|health|api\/health|products|api\/products|qrcodes|api\/qrcodes|analytics|api\/analytics|qr-sticker-templates|api\/qr-sticker-templates|api\/scan|feedback|api\/feedback|complaint|api\/complaint|compliment|api\/compliment|uploads|api\/uploads)\b).*/, (_request, response) => {
    response.sendFile(path.join(frontendDistDir, 'index.html'))
  })
}

app.use(notFound)
app.use(errorHandler)
