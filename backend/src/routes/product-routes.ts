import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'

import { productController } from '../controllers/product-controller.js'
import { getUploadRootDir } from '../utils/upload-paths.js'

const upload = multer({ dest: path.join(getUploadRootDir(), 'products') })
export const productRoutes = Router()
productRoutes.get('/', productController.list)
productRoutes.get('/:id', productController.get)
productRoutes.post('/', upload.single('image'), productController.create)
productRoutes.put('/:id', upload.single('image'), productController.update)
productRoutes.delete('/:id', productController.remove)
