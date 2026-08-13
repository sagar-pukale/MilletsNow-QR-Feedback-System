"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.qrCodeController = void 0;
const qrcode_service_js_1 = require("../services/qrcode-service.js");
exports.qrCodeController = {
    async list(request, response, next) { try {
        response.json(await qrcode_service_js_1.qrCodeService.list(request.query));
    }
    catch (error) {
        next(error);
    } },
    async get(request, response, next) { try {
        const item = await qrcode_service_js_1.qrCodeService.get(String(request.params.id));
        if (!item)
            return response.status(404).json({ error: 'QR code not found' });
        response.json(item);
    }
    catch (error) {
        next(error);
    } },
    async generate(request, response, next) { try {
        response.status(201).json(await qrcode_service_js_1.qrCodeService.generate(request.body));
    }
    catch (error) {
        next(error);
    } },
    async bulk(request, response, next) { try {
        response.status(201).json(await qrcode_service_js_1.qrCodeService.generate(request.body));
    }
    catch (error) {
        next(error);
    } },
    async remove(request, response, next) { try {
        if (!await qrcode_service_js_1.qrCodeService.remove(String(request.params.id)))
            return response.status(404).json({ error: 'QR code not found' });
        response.status(204).send();
    }
    catch (error) {
        next(error);
    } },
    async status(request, response, next) { try {
        const item = await qrcode_service_js_1.qrCodeService.setStatus(String(request.params.id), request.body.status === 'deactivated' ? 'deactivated' : 'active');
        if (!item)
            return response.status(404).json({ error: 'QR code not found' });
        response.json(item);
    }
    catch (error) {
        next(error);
    } },
    download(request, response) { response.json({ message: 'Download bundle ready', format: request.query.format ?? 'png' }); },
    print(_request, response) { response.json({ message: 'Print job prepared' }); },
};
