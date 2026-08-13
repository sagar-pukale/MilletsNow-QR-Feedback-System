import { Router } from 'express'

import { qrStickerTemplateController } from '../controllers/qr-sticker-template-controller.js'

export const qrStickerTemplateRoutes = Router()

qrStickerTemplateRoutes.get('/', qrStickerTemplateController.list)
qrStickerTemplateRoutes.get('/:id', qrStickerTemplateController.get)
qrStickerTemplateRoutes.post('/', qrStickerTemplateController.create)
qrStickerTemplateRoutes.put('/:id', qrStickerTemplateController.update)
qrStickerTemplateRoutes.post('/:id/duplicate', qrStickerTemplateController.duplicate)
qrStickerTemplateRoutes.get('/:id/download', qrStickerTemplateController.downloadPdf)
qrStickerTemplateRoutes.delete('/:id', qrStickerTemplateController.remove)
