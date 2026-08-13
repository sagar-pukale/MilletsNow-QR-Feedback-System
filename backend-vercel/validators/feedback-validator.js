"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedbackSchema = void 0;
const zod_1 = require("zod");
exports.feedbackSchema = zod_1.z.object({ type: zod_1.z.enum(['feedback', 'compliment', 'complaint', 'question']), rating: zod_1.z.number().int().min(1).max(5).optional(), message: zod_1.z.string().trim().min(1), name: zod_1.z.string().trim().optional(), email: zod_1.z.string().email().optional(), qrToken: zod_1.z.string().trim().min(1).optional() });
