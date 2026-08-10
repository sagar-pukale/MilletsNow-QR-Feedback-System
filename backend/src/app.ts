import compression from 'compression'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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

export const app = express()
const currentDir = path.dirname(fileURLToPath(import.meta.url))
const frontendDistDir = path.resolve(currentDir, '..', '..', 'frontend', 'dist')
const hasFrontendBuild = existsSync(frontendDistDir)

app.disable('x-powered-by')
app.use(helmet({ contentSecurityPolicy: false }))

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (
        origin === env.CORS_ORIGIN ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        return callback(null, true)
      }
      return callback(null, true)
    },
    credentials: true,
  }),
)

app.use(compression())
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(['/uploads', '/api/uploads'], express.static(path.resolve(env.UPLOAD_DIR)))

app.use(['/auth', '/api/auth'], authRoutes)
app.use(['/health', '/api/health'], healthRoute)
app.use(['/products', '/api/products', '/qrcodes', '/api/qrcodes'], requireAuth)
app.use(['/products', '/api/products'], productRoutes)
app.use(['/qrcodes', '/api/qrcodes'], qrCodeRoutes)
app.use(['/scan', '/api/scan'], scanRoutes)
app.use(['/feedback', '/api/feedback'], feedbackRoutes)

if (hasFrontendBuild) {
  app.use(express.static(frontendDistDir))
  app.get(/^(?!\/(?:auth|api\/auth|health|api\/health|products|api\/products|qrcodes|api\/qrcodes|scan|api\/scan|feedback|api\/feedback|uploads|api\/uploads)\b).*/, (_request, response) => {
    response.sendFile(path.join(frontendDistDir, 'index.html'))
  })
}

app.use(notFound)
app.use(errorHandler)
