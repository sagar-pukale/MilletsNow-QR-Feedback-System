import { z } from 'zod';
export const feedbackSchema = z.object({ type: z.enum(['feedback', 'compliment', 'complaint', 'question']), rating: z.number().int().min(1).max(5).optional(), message: z.string().trim().min(1), name: z.string().trim().optional(), email: z.string().email().optional(), qrToken: z.string().trim().min(1).optional() });
