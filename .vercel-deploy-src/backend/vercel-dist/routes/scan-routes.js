"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanRoutes = void 0;
const express_1 = require("express");
const qrcode_service_js_1 = require("../services/qrcode-service.js");
exports.scanRoutes = (0, express_1.Router)();
exports.scanRoutes.get('/:token', async (request, response, next) => {
    try {
        const qr = await qrcode_service_js_1.qrCodeService.findByToken(request.params.token);
        if (!qr || qr.status !== 'active')
            return response.status(404).json({ error: 'QR code not found' });
        await qrcode_service_js_1.qrCodeService.recordScan({
            qrCodeId: qr.id,
            ipAddress: request.ip ?? null,
            userAgent: request.get('user-agent') ?? null,
            deviceType: request.get('sec-ch-ua-mobile') === '?1' ? 'mobile' : 'desktop',
        });
        response.json({
            token: qr.qrToken,
            destinationUrl: `/scan/${qr.qrToken}`,
            product: {
                id: qr.productId,
                name: qr.productName,
                brand: qr.brand,
                category: qr.category,
                weight: qr.weight,
                unit: qr.unit,
                batchNumber: qr.batchNumber,
                manufacturingDate: qr.manufacturingDate,
                expiryDate: qr.expiryDate,
                mrp: qr.mrp,
                description: qr.description,
                image: qr.imageUrl,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
