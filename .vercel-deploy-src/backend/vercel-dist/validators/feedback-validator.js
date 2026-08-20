"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedbackSchema = void 0;
const zod_1 = require("zod");
const optionalTrimmedString = zod_1.z
    .string()
    .trim()
    .transform((value) => (value.length ? value : undefined))
    .optional();
exports.feedbackSchema = zod_1.z
    .object({
    type: zod_1.z.enum(['feedback', 'compliment', 'complaint', 'question']),
    rating: zod_1.z.coerce.number().int().min(1).max(5).optional(),
    message: optionalTrimmedString,
    name: optionalTrimmedString,
    email: zod_1.z
        .string()
        .trim()
        .email()
        .optional()
        .or(zod_1.z.literal('').transform(() => undefined)),
    qrToken: zod_1.z.string().trim().min(1),
    quality: optionalTrimmedString,
    category: optionalTrimmedString,
})
    .superRefine((value, context) => {
    if ((value.type === 'feedback' || value.type === 'compliment') && !value.rating) {
        context.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['rating'],
            message: 'Rating is required.',
        });
    }
    if (value.type === 'feedback' && !value.quality) {
        context.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['quality'],
            message: 'Taste / Quality selection is required.',
        });
    }
    if (value.type === 'complaint') {
        if (!value.category) {
            context.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                path: ['category'],
                message: 'Complaint category is required.',
            });
        }
        if (!value.message) {
            context.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                path: ['message'],
                message: 'Complaint description is required.',
            });
        }
    }
});
