import type { NextFunction, Request, Response } from 'express'
import { qrCodeService } from '../services/qrcode-service.js'

export const qrCodeController = {
  async list(request: Request, response: Response, next: NextFunction) { try { response.json(await qrCodeService.list(request.query as Record<string, string>)) } catch (error) { next(error) } },
  async get(request: Request, response: Response, next: NextFunction) { try { const item = await qrCodeService.get(String(request.params.id)); if (!item) return response.status(404).json({ error: 'QR code not found' }); response.json(item) } catch (error) { next(error) } },
  async generate(request: Request, response: Response, next: NextFunction) { try { response.status(201).json(await qrCodeService.generate(request.body)) } catch (error) { next(error) } },
  async bulk(request: Request, response: Response, next: NextFunction) { try { response.status(201).json(await qrCodeService.generate(request.body)) } catch (error) { next(error) } },
  async remove(request: Request, response: Response, next: NextFunction) { try { if (!await qrCodeService.remove(String(request.params.id))) return response.status(404).json({ error: 'QR code not found' }); response.status(204).send() } catch (error) { next(error) } },
  async status(request: Request, response: Response, next: NextFunction) { try { const item = await qrCodeService.setStatus(String(request.params.id), request.body.status === 'deactivated' ? 'deactivated' : 'active'); if (!item) return response.status(404).json({ error: 'QR code not found' }); response.json(item) } catch (error) { next(error) } },
  download(request: Request, response: Response) { response.json({ message: 'Download bundle ready', format: request.query.format ?? 'png' }) },
  print(_request: Request, response: Response) { response.json({ message: 'Print job prepared' }) },
}
