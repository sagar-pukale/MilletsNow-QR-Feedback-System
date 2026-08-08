import { qrCodeService } from '../services/qrcode-service.js';
export const qrCodeController = {
    async list(request, response, next) { try {
        response.json(await qrCodeService.list(request.query));
    }
    catch (error) {
        next(error);
    } },
    async get(request, response, next) { try {
        const item = await qrCodeService.get(String(request.params.id));
        if (!item)
            return response.status(404).json({ error: 'QR code not found' });
        response.json(item);
    }
    catch (error) {
        next(error);
    } },
    async generate(request, response, next) { try {
        response.status(201).json(await qrCodeService.generate(request.body));
    }
    catch (error) {
        next(error);
    } },
    async bulk(request, response, next) { try {
        response.status(201).json(await qrCodeService.generate(request.body));
    }
    catch (error) {
        next(error);
    } },
    async remove(request, response, next) { try {
        if (!await qrCodeService.remove(String(request.params.id)))
            return response.status(404).json({ error: 'QR code not found' });
        response.status(204).send();
    }
    catch (error) {
        next(error);
    } },
    async status(request, response, next) { try {
        const item = await qrCodeService.setStatus(String(request.params.id), request.body.status === 'deactivated' ? 'deactivated' : 'active');
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
