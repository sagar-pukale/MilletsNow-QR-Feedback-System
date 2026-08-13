import { Router } from 'express'
import multer from 'multer'

import { productController } from '../controllers/product-controller.js'
import { AppError } from '../services/product-image-service.js'

const allowedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp'])

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      callback(null, true)
      return
    }
    callback(new AppError('Only PNG, JPG, JPEG, and WEBP images are allowed.', 400))
  },
})

export const productRoutes = Router()

function handleUpload(fieldName: string) {
  const middleware = upload.single(fieldName)
  return (request: Parameters<typeof middleware>[0], response: Parameters<typeof middleware>[1], next: Parameters<typeof middleware>[2]) => {
    middleware(request, response, (error) => {
      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        next(new AppError('Product image must be 10 MB or smaller.', 400))
        return
      }
      next(error)
    })
  }
}

productRoutes.get('/', productController.list)
productRoutes.get('/:id', productController.get)
productRoutes.post('/', handleUpload('image'), productController.create)
productRoutes.post('/:id/image', handleUpload('image'), productController.uploadImage)
productRoutes.put('/:id', handleUpload('image'), productController.update)
productRoutes.delete('/:id', productController.remove)
