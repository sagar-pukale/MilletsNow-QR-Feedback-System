"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productIdSchema = exports.productUpdateSchema = exports.productCreateSchema = void 0;
const zod_1 = require("zod");
const optionalDateSchema = zod_1.z.union([
    zod_1.z.coerce.date(),
    zod_1.z.literal(''),
    zod_1.z.null(),
]).optional().transform((val) => (val === '' || val === null ? undefined : val));
exports.productCreateSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1),
    sku: zod_1.z.string().trim().min(1),
    categoryId: zod_1.z.string().uuid().optional().nullable(),
    categoryName: zod_1.z.string().trim().optional().nullable(),
    description: zod_1.z.string().optional().nullable(),
    mrp: zod_1.z.coerce.number().nonnegative().optional().nullable(),
    sellingPrice: zod_1.z.coerce.number().nonnegative().optional().nullable(),
    weight: zod_1.z.coerce.number().positive().optional().nullable(),
    unit: zod_1.z.string().trim().optional().nullable(),
    brand: zod_1.z.string().trim().optional().nullable(),
    imageUrl: zod_1.z.string().optional().nullable(),
    isActive: zod_1.z.union([zod_1.z.boolean(), zod_1.z.string().transform((v) => v === 'true')]).default(true),
    manufacturingDate: optionalDateSchema,
    expiryDate: optionalDateSchema,
    batchNumber: zod_1.z.string().trim().optional().nullable(),
    quantity: zod_1.z.coerce.number().int().nonnegative().default(0),
});
exports.productUpdateSchema = exports.productCreateSchema.partial();
exports.productIdSchema = zod_1.z.string().uuid();
