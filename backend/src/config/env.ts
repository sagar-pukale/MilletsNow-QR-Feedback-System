import { existsSync } from 'node:fs'
import path from 'node:path'
import { config as loadDotenv } from 'dotenv'
import { z } from 'zod'

const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', '.env'),
]

for (const candidate of envCandidates) {
  if (existsSync(candidate)) {
    loadDotenv({ path: candidate, override: false })
    break
  }
}

const isProduction = process.env.NODE_ENV === 'production'
const developmentDefaults = isProduction
  ? {}
  : {
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/milletsnow',
      JWT_SECRET: 'development-only-change-me-please',
      CORS_ORIGIN: 'http://localhost:5173',
    }

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('1d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  PUBLIC_APP_URL: z.string().url().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).default('farmer-uploads'),
  REVERSE_GEOCODER_BASE_URL: z.string().url().optional(),
  REVERSE_GEOCODER_CONTACT: z.string().min(3).optional(),
  UPLOAD_DIR: z.string().default('uploads'),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(12).optional(),
})

export const env = envSchema.parse({ ...developmentDefaults, ...process.env })
