import type { NextFunction, Request, Response } from 'express'

import { qrStickerTemplateService } from '../services/qr-sticker-template-service.js'
import { resolvePublicAppUrl } from '../utils/public-app-url.js'

export const qrStickerTemplateController = {
  async list(request: Request, response: Response, next: NextFunction) {
    try {
      response.json(await qrStickerTemplateService.list(resolvePublicAppUrl(request)))
    } catch (error) {
      next(error)
    }
  },

  async get(request: Request, response: Response, next: NextFunction) {
    try {
      const template = await qrStickerTemplateService.get(String(request.params.id), resolvePublicAppUrl(request))
      if (!template) return response.status(404).json({ error: 'Sticker template not found' })
      response.json(template)
    } catch (error) {
      next(error)
    }
  },

  async create(request: Request, response: Response, next: NextFunction) {
    try {
      response.status(201).json(await qrStickerTemplateService.create(request.body, resolvePublicAppUrl(request)))
    } catch (error) {
      next(error)
    }
  },

  async update(request: Request, response: Response, next: NextFunction) {
    try {
      const template = await qrStickerTemplateService.update(String(request.params.id), request.body, resolvePublicAppUrl(request))
      if (!template) return response.status(404).json({ error: 'Sticker template not found' })
      response.json(template)
    } catch (error) {
      next(error)
    }
  },

  async duplicate(request: Request, response: Response, next: NextFunction) {
    try {
      const template = await qrStickerTemplateService.duplicate(String(request.params.id), resolvePublicAppUrl(request))
      if (!template) return response.status(404).json({ error: 'Sticker template not found' })
      response.status(201).json(template)
    } catch (error) {
      next(error)
    }
  },

  async remove(request: Request, response: Response, next: NextFunction) {
    try {
      if (!await qrStickerTemplateService.remove(String(request.params.id))) {
        return response.status(404).json({ error: 'Sticker template not found' })
      }
      response.status(204).send()
    } catch (error) {
      next(error)
    }
  },

  async downloadPdf(request: Request, response: Response, next: NextFunction) {
    try {
      const pdf = await qrStickerTemplateService.downloadPdf(String(request.params.id), resolvePublicAppUrl(request))
      if (!pdf) return response.status(404).json({ error: 'Sticker template not found' })

      const disposition = request.query.disposition === 'inline' ? 'inline' : 'attachment'
      response.setHeader('Content-Type', 'application/pdf')
      response.setHeader('Content-Disposition', `${disposition}; filename="${pdf.filename}"`)
      response.send(pdf.buffer)
    } catch (error) {
      next(error)
    }
  },
}
