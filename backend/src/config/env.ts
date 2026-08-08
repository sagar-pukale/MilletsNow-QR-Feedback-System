import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url().default('postgresql://postgres:postgres@localhost:5432/milletsnow'),
  JWT_SECRET: z.string().min(16).default('development-only-change-me-please'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  UPLOAD_DIR: z.string().default('uploads'),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(12).optional(),
})

export const env = envSchema.parse(process.env)
