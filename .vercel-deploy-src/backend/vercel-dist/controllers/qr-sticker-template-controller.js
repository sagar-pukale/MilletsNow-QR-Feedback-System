"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.qrStickerTemplateController = void 0;
const qr_sticker_template_service_js_1 = require("../services/qr-sticker-template-service.js");
function publicBaseUrl(request) {
    const protocol = request.get('x-forwarded-proto') ?? request.protocol;
    const host = request.get('x-forwarded-host') ?? request.get('host');
    if (!host)
        return 'https://millets-now-qr-feedback-system.vercel.app';
    return `${protocol}://${host}`;
}
exports.qrStickerTemplateController = {
    async list(_request, response, next) {
        try {
            response.json(await qr_sticker_template_service_js_1.qrStickerTemplateService.list());
        }
        catch (error) {
            next(error);
        }
    },
    async get(request, response, next) {
        try {
            const template = await qr_sticker_template_service_js_1.qrStickerTemplateService.get(String(request.params.id));
            if (!template)
                return response.status(404).json({ error: 'Sticker template not found' });
            response.json(template);
        }
        catch (error) {
            next(error);
        }
    },
    async create(request, response, next) {
        try {
            response.status(201).json(await qr_sticker_template_service_js_1.qrStickerTemplateService.create(request.body, publicBaseUrl(request)));
        }
        catch (error) {
            next(error);
        }
    },
    async update(request, response, next) {
        try {
            const template = await qr_sticker_template_service_js_1.qrStickerTemplateService.update(String(request.params.id), request.body, publicBaseUrl(request));
            if (!template)
                return response.status(404).json({ error: 'Sticker template not found' });
            response.json(template);
        }
        catch (error) {
            next(error);
        }
    },
    async duplicate(request, response, next) {
        try {
            const template = await qr_sticker_template_service_js_1.qrStickerTemplateService.duplicate(String(request.params.id), publicBaseUrl(request));
            if (!template)
                return response.status(404).json({ error: 'Sticker template not found' });
            response.status(201).json(template);
        }
        catch (error) {
            next(error);
        }
    },
    async remove(request, response, next) {
        try {
            if (!await qr_sticker_template_service_js_1.qrStickerTemplateService.remove(String(request.params.id))) {
                return response.status(404).json({ error: 'Sticker template not found' });
            }
            response.status(204).send();
        }
        catch (error) {
            next(error);
        }
    },
    async downloadPdf(request, response, next) {
        try {
            const pdf = await qr_sticker_template_service_js_1.qrStickerTemplateService.downloadPdf(String(request.params.id));
            if (!pdf)
                return response.status(404).json({ error: 'Sticker template not found' });
            const disposition = request.query.disposition === 'inline' ? 'inline' : 'attachment';
            response.setHeader('Content-Type', 'application/pdf');
            response.setHeader('Content-Disposition', `${disposition}; filename="${pdf.filename}"`);
            response.send(pdf.buffer);
        }
        catch (error) {
            next(error);
        }
    },
};
