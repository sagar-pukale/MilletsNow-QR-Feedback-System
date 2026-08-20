"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.qrStickerTemplateUpdateSchema = exports.qrStickerTemplateSchema = exports.stickerTemplateIdSchema = void 0;
const zod_1 = require("zod");
exports.stickerTemplateIdSchema = zod_1.z.string().uuid();
exports.qrStickerTemplateSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, 'Sticker template name is required.'),
    productId: zod_1.z.string().uuid('Select a valid product.'),
    qrCodeId: zod_1.z.string().uuid().optional().nullable(),
    labelTemplate: zod_1.z.literal('avery_5160').default('avery_5160'),
    textMode: zod_1.z.enum(['product_name', 'product_name_sku', 'sku']).default('product_name_sku'),
    textSize: zod_1.z.coerce.number().int().min(8).max(24).default(12),
    qrSize: zod_1.z.coerce.number().int().min(72).max(180).default(108),
    stickerConfig: zod_1.z.object({
        columns: zod_1.z.coerce.number().int().default(3),
        rows: zod_1.z.coerce.number().int().default(10),
        page: zod_1.z.literal('letter').default('letter'),
        labelWidthInches: zod_1.z.coerce.number().default(2.625),
        labelHeightInches: zod_1.z.coerce.number().default(1),
        marginTopInches: zod_1.z.coerce.number().default(0.5),
        marginLeftInches: zod_1.z.coerce.number().default(0.1875),
        horizontalGapInches: zod_1.z.coerce.number().default(0.125),
        verticalGapInches: zod_1.z.coerce.number().default(0),
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
});
exports.qrStickerTemplateUpdateSchema = exports.qrStickerTemplateSchema.partial();
