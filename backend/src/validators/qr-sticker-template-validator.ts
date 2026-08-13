import { z } from 'zod'

export const stickerTemplateIdSchema = z.string().uuid()

export const qrStickerTemplateSchema = z.object({
  name: z.string().trim().min(1, 'Sticker template name is required.'),
  productId: z.string().uuid('Select a valid product.'),
  qrCodeId: z.string().uuid().optional().nullable(),
  labelTemplate: z.literal('avery_5160').default('avery_5160'),
  textMode: z.enum(['product_name', 'product_name_sku', 'sku']).default('product_name_sku'),
  textSize: z.coerce.number().int().min(8).max(24).default(12),
  qrSize: z.coerce.number().int().min(72).max(180).default(108),
  stickerConfig: z.object({
    columns: z.coerce.number().int().default(3),
    rows: z.coerce.number().int().default(10),
    page: z.literal('letter').default('letter'),
    labelWidthInches: z.coerce.number().default(2.625),
    labelHeightInches: z.coerce.number().default(1),
    marginTopInches: z.coerce.number().default(0.5),
    marginLeftInches: z.coerce.number().default(0.1875),
    horizontalGapInches: z.coerce.number().default(0.125),
    verticalGapInches: z.coerce.number().default(0),
  }).default({
    columns: 3,
    rows: 10,
    page: 'letter',
    labelWidthInches: 2.625,
    labelHeightInches: 1,
    marginTopInches: 0.5,
    marginLeftInches: 0.1875,
    horizontalGapInches: 0.125,
    verticalGapInches: 0,
  }),
})

export const qrStickerTemplateUpdateSchema = qrStickerTemplateSchema.partial()
