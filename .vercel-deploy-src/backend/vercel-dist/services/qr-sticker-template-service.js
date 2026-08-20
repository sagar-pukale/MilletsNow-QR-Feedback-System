"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.qrStickerTemplateService = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
const pdf_lib_1 = require("pdf-lib");
const prisma_js_1 = require("../config/prisma.js");
const qr_sticker_template_validator_js_1 = require("../validators/qr-sticker-template-validator.js");
const pointsPerInch = 72;
const labelTemplateConfig = {
    avery_5160: {
        name: 'Avery 5160',
        columns: 3,
        rows: 10,
        pageWidthInches: 8.5,
        pageHeightInches: 11,
        labelWidthInches: 2.625,
        labelHeightInches: 1,
        marginTopInches: 0.5,
        marginLeftInches: 0.1875,
        horizontalGapInches: 0.125,
        verticalGapInches: 0,
    },
};
function defaultDestinationUrl(token, publicBaseUrl) {
    return `${publicBaseUrl.replace(/\/+$/, '')}/scan/${encodeURIComponent(token)}`;
}
function normalizeDestinationUrl(destinationUrl, token, publicBaseUrl) {
    if (destinationUrl && /^https?:\/\//i.test(destinationUrl) && !destinationUrl.includes('localhost')) {
        return destinationUrl;
    }
    return defaultDestinationUrl(token, publicBaseUrl);
}
function toStickerText(template) {
    if (template.textMode === 'sku')
        return template.productSku;
    if (template.textMode === 'product_name')
        return template.productName;
    return `${template.productName} · ${template.productSku}`;
}
async function resolveProductQrCode(productId, qrCodeId) {
    if (qrCodeId) {
        const qr = await prisma_js_1.prisma.qRCode.findFirst({
            where: {
                id: qrCodeId,
                productId,
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                    },
                },
            },
        });
        if (!qr)
            throw new Error('Selected QR code was not found for this product.');
        return qr;
    }
    const qr = await prisma_js_1.prisma.qRCode.findFirst({
        where: {
            productId,
            status: 'active',
        },
        orderBy: {
            createdAt: 'asc',
        },
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    sku: true,
                },
            },
        },
    });
    if (!qr) {
        throw new Error('No active product QR code is available. Generate a QR code for this product first.');
    }
    return qr;
}
async function qrImageFor(template) {
    return qrcode_1.default.toDataURL(template.qrDestinationUrl, {
        margin: 1,
        width: template.qrSize,
    });
}
async function present(record) {
    const qrImage = await qrImageFor({
        qrDestinationUrl: record.qrDestinationUrl,
        qrSize: record.qrSize,
    });
    return {
        id: record.id,
        name: record.name,
        productId: record.productId,
        productName: record.productName,
        productSku: record.productSku,
        qrCodeId: record.qrCodeId,
        qrToken: record.qrToken,
        qrDestinationUrl: record.qrDestinationUrl,
        labelTemplate: record.labelTemplate,
        labelTemplateName: labelTemplateConfig.avery_5160.name,
        textMode: record.textMode,
        textSize: record.textSize,
        qrSize: record.qrSize,
        stickerConfig: record.stickerConfig,
        qrImage,
        displayText: toStickerText(record),
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        product: {
            id: record.product.id,
            name: record.product.name,
            sku: record.product.sku,
            imageUrl: record.product.imageUrl,
        },
    };
}
async function buildPdfBuffer(record) {
    const pdf = await pdf_lib_1.PDFDocument.create();
    const pageConfig = labelTemplateConfig.avery_5160;
    const page = pdf.addPage([
        pageConfig.pageWidthInches * pointsPerInch,
        pageConfig.pageHeightInches * pointsPerInch,
    ]);
    const font = await pdf.embedFont(pdf_lib_1.StandardFonts.Helvetica);
    const bold = await pdf.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
    const qrPng = await pdf.embedPng(await qrImageFor({
        qrDestinationUrl: record.qrDestinationUrl,
        qrSize: 240,
    }));
    const stickerText = toStickerText(record);
    const labelWidth = pageConfig.labelWidthInches * pointsPerInch;
    const labelHeight = pageConfig.labelHeightInches * pointsPerInch;
    const marginLeft = pageConfig.marginLeftInches * pointsPerInch;
    const marginTop = pageConfig.marginTopInches * pointsPerInch;
    const horizontalGap = pageConfig.horizontalGapInches * pointsPerInch;
    const verticalGap = pageConfig.verticalGapInches * pointsPerInch;
    for (let row = 0; row < pageConfig.rows; row += 1) {
        for (let column = 0; column < pageConfig.columns; column += 1) {
            const x = marginLeft + column * (labelWidth + horizontalGap);
            const topY = page.getHeight() - marginTop - row * (labelHeight + verticalGap);
            const y = topY - labelHeight;
            page.drawRectangle({
                x,
                y,
                width: labelWidth,
                height: labelHeight,
                borderColor: (0, pdf_lib_1.rgb)(0.88, 0.84, 0.79),
                borderWidth: 0.5,
            });
            const qrSize = Math.min(record.qrSize * 0.55, labelHeight - 10);
            const qrX = x + 6;
            const qrY = y + (labelHeight - qrSize) / 2;
            page.drawImage(qrPng, {
                x: qrX,
                y: qrY,
                width: qrSize,
                height: qrSize,
            });
            const textX = qrX + qrSize + 8;
            const titleY = y + labelHeight - 18;
            const bodyFontSize = Math.min(record.textSize, 12);
            page.drawText(record.productName, {
                x: textX,
                y: titleY,
                size: Math.min(bodyFontSize + 1, 13),
                font: bold,
                color: (0, pdf_lib_1.rgb)(0.2, 0.08, 0.12),
                maxWidth: labelWidth - (textX - x) - 8,
            });
            page.drawText(record.productSku, {
                x: textX,
                y: titleY - 16,
                size: Math.max(bodyFontSize - 1, 8),
                font,
                color: (0, pdf_lib_1.rgb)(0.34, 0.31, 0.31),
                maxWidth: labelWidth - (textX - x) - 8,
            });
            page.drawText(stickerText, {
                x: textX,
                y: titleY - 31,
                size: Math.max(bodyFontSize - 1, 8),
                font,
                color: (0, pdf_lib_1.rgb)(0.34, 0.31, 0.31),
                maxWidth: labelWidth - (textX - x) - 8,
            });
            page.drawText(record.qrDestinationUrl, {
                x: x + 6,
                y: y + 4,
                size: 6,
                font,
                color: (0, pdf_lib_1.rgb)(0.42, 0.39, 0.39),
                maxWidth: labelWidth - 12,
            });
        }
    }
    return Buffer.from(await pdf.save());
}
exports.qrStickerTemplateService = {
    async list() {
        const rows = await prisma_js_1.prisma.qRStickerTemplate.findMany({
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        imageUrl: true,
                    },
                },
                qrCode: {
                    select: {
                        id: true,
                        code: true,
                        destinationUrl: true,
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });
        return {
            items: await Promise.all(rows.map((row) => present(row))),
        };
    },
    async get(id) {
        const templateId = qr_sticker_template_validator_js_1.stickerTemplateIdSchema.parse(id);
        const row = await prisma_js_1.prisma.qRStickerTemplate.findUnique({
            where: { id: templateId },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        imageUrl: true,
                    },
                },
                qrCode: {
                    select: {
                        id: true,
                        code: true,
                        destinationUrl: true,
                    },
                },
            },
        });
        return row ? present(row) : null;
    },
    async create(input, publicBaseUrl) {
        const data = qr_sticker_template_validator_js_1.qrStickerTemplateSchema.parse(input);
        const qrCode = await resolveProductQrCode(data.productId, data.qrCodeId);
        const destinationUrl = normalizeDestinationUrl(qrCode.destinationUrl?.trim(), qrCode.code, publicBaseUrl);
        const row = await prisma_js_1.prisma.qRStickerTemplate.create({
            data: {
                name: data.name,
                productId: qrCode.productId,
                qrCodeId: qrCode.id,
                productName: qrCode.product.name,
                productSku: qrCode.product.sku,
                qrToken: qrCode.code,
                qrDestinationUrl: destinationUrl,
                labelTemplate: data.labelTemplate,
                textMode: data.textMode,
                textSize: data.textSize,
                qrSize: data.qrSize,
                stickerConfig: data.stickerConfig,
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        imageUrl: true,
                    },
                },
                qrCode: {
                    select: {
                        id: true,
                        code: true,
                        destinationUrl: true,
                    },
                },
            },
        });
        return present(row);
    },
    async update(id, input, publicBaseUrl) {
        const templateId = qr_sticker_template_validator_js_1.stickerTemplateIdSchema.parse(id);
        const data = qr_sticker_template_validator_js_1.qrStickerTemplateUpdateSchema.parse(input);
        const existing = await prisma_js_1.prisma.qRStickerTemplate.findUnique({ where: { id: templateId } });
        if (!existing)
            return null;
        const productId = data.productId ?? existing.productId;
        const qrCode = await resolveProductQrCode(productId, data.qrCodeId ?? existing.qrCodeId);
        const destinationUrl = normalizeDestinationUrl(qrCode.destinationUrl?.trim(), qrCode.code, publicBaseUrl);
        const row = await prisma_js_1.prisma.qRStickerTemplate.update({
            where: { id: templateId },
            data: {
                ...(data.name !== undefined ? { name: data.name } : {}),
                productId: qrCode.productId,
                qrCodeId: qrCode.id,
                productName: qrCode.product.name,
                productSku: qrCode.product.sku,
                qrToken: qrCode.code,
                qrDestinationUrl: destinationUrl,
                ...(data.labelTemplate !== undefined ? { labelTemplate: data.labelTemplate } : {}),
                ...(data.textMode !== undefined ? { textMode: data.textMode } : {}),
                ...(data.textSize !== undefined ? { textSize: data.textSize } : {}),
                ...(data.qrSize !== undefined ? { qrSize: data.qrSize } : {}),
                ...(data.stickerConfig !== undefined ? { stickerConfig: data.stickerConfig } : {}),
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        imageUrl: true,
                    },
                },
                qrCode: {
                    select: {
                        id: true,
                        code: true,
                        destinationUrl: true,
                    },
                },
            },
        });
        return present(row);
    },
    async duplicate(id, publicBaseUrl) {
        const templateId = qr_sticker_template_validator_js_1.stickerTemplateIdSchema.parse(id);
        const existing = await prisma_js_1.prisma.qRStickerTemplate.findUnique({ where: { id: templateId } });
        if (!existing)
            return null;
        const row = await prisma_js_1.prisma.qRStickerTemplate.create({
            data: {
                name: `${existing.name} Copy`,
                productId: existing.productId,
                qrCodeId: existing.qrCodeId,
                productName: existing.productName,
                productSku: existing.productSku,
                qrToken: existing.qrToken,
                qrDestinationUrl: normalizeDestinationUrl(existing.qrDestinationUrl, existing.qrToken, publicBaseUrl),
                labelTemplate: existing.labelTemplate,
                textMode: existing.textMode,
                textSize: existing.textSize,
                qrSize: existing.qrSize,
                stickerConfig: (existing.stickerConfig ?? {}),
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        imageUrl: true,
                    },
                },
                qrCode: {
                    select: {
                        id: true,
                        code: true,
                        destinationUrl: true,
                    },
                },
            },
        });
        return present(row);
    },
    async remove(id) {
        const templateId = qr_sticker_template_validator_js_1.stickerTemplateIdSchema.parse(id);
        try {
            await prisma_js_1.prisma.qRStickerTemplate.delete({ where: { id: templateId } });
            return true;
        }
        catch {
            return false;
        }
    },
    async downloadPdf(id) {
        const templateId = qr_sticker_template_validator_js_1.stickerTemplateIdSchema.parse(id);
        const row = await prisma_js_1.prisma.qRStickerTemplate.findUnique({
            where: { id: templateId },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        imageUrl: true,
                    },
                },
                qrCode: {
                    select: {
                        id: true,
                        code: true,
                        destinationUrl: true,
                    },
                },
            },
        });
        if (!row)
            return null;
        return {
            filename: `${row.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'qr-sticker-template'}.pdf`,
            buffer: await buildPdfBuffer(row),
        };
    },
};
