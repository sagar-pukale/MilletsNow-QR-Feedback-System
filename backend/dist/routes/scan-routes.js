import { Router } from 'express';
import { qrCodeService } from '../services/qrcode-service.js';
export const scanRoutes = Router();
scanRoutes.get('/:token', async (request, response, next) => {
    try {
        const qr = await qrCodeService.findByToken(request.params.token);
        if (!qr || qr.status !== 'active')
            return response.status(404).json({ error: 'QR code not found' });
        await qrCodeService.recordScan({
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
