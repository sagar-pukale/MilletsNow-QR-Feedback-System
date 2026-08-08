import { z } from 'zod';
const optionalDateSchema = z.union([
    z.coerce.date(),
    z.literal(''),
    z.null(),
]).optional().transform((val) => (val === '' || val === null ? undefined : val));
export const productCreateSchema = z.object({
    name: z.string().trim().min(1),
    sku: z.string().trim().min(1),
    categoryId: z.string().uuid().optional().nullable(),
    categoryName: z.string().trim().optional().nullable(),
    description: z.string().optional().nullable(),
    mrp: z.coerce.number().nonnegative().optional().nullable(),
    sellingPrice: z.coerce.number().nonnegative().optional().nullable(),
    weight: z.coerce.number().positive().optional().nullable(),
    unit: z.string().trim().optional().nullable(),
    brand: z.string().trim().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
    isActive: z.union([z.boolean(), z.string().transform((v) => v === 'true')]).default(true),
    manufacturingDate: optionalDateSchema,
    expiryDate: optionalDateSchema,
    batchNumber: z.string().trim().optional().nullable(),
    quantity: z.coerce.number().int().nonnegative().default(0),
});
export const productUpdateSchema = productCreateSchema.partial();
export const productIdSchema = z.string().uuid();
