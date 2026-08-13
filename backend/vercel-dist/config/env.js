"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    PORT: zod_1.z.coerce.number().int().positive().default(4000),
    DATABASE_URL: zod_1.z.string().url().default('postgresql://postgres:postgres@localhost:5432/milletsnow'),
    JWT_SECRET: zod_1.z.string().min(16).default('development-only-change-me-please'),
    JWT_EXPIRES_IN: zod_1.z.string().default('1d'),
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:5173'),
    PUBLIC_APP_URL: zod_1.z.string().url().optional(),
    SUPABASE_URL: zod_1.z.string().url().optional(),
    SUPABASE_SERVICE_ROLE_KEY: zod_1.z.string().min(1).optional(),
    SUPABASE_PUBLISHABLE_KEY: zod_1.z.string().min(1).optional(),
    SUPABASE_ANON_KEY: zod_1.z.string().min(1).optional(),
    SUPABASE_STORAGE_BUCKET: zod_1.z.string().min(1).default('farmer-uploads'),
    UPLOAD_DIR: zod_1.z.string().default('uploads'),
    ADMIN_EMAIL: zod_1.z.string().email().optional(),
    ADMIN_PASSWORD: zod_1.z.string().min(12).optional(),
});
exports.env = envSchema.parse(process.env);
