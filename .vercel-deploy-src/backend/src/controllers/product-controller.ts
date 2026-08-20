import type { NextFunction, Request, Response } from 'express'

import { productService } from '../services/product-service.js'

export const productController = {
  async list(request: Request, response: Response, next: NextFunction) {
    try { response.json(await productService.list(request.query as Record<string, string>)) } catch (error) { next(error) }
  },
  async get(request: Request, response: Response, next: NextFunction) {
    try { const product = await productService.get(String(request.params.id)); if (!product) return response.status(404).json({ error: 'Product not found' }); response.json(product) } catch (error) { next(error) }
  },
  async create(request: Request, response: Response, next: NextFunction) {
    try { response.status(201).json(await productService.create(request.body, request.file)) } catch (error) { next(error) }
  },
  async update(request: Request, response: Response, next: NextFunction) {
    try { response.json(await productService.update(String(request.params.id), request.body, request.file)) } catch (error) { next(error) }
  },
  async uploadImage(request: Request, response: Response, next: NextFunction) {
    try { response.json(await productService.uploadImage(String(request.params.id), request.file!)) } catch (error) { next(error) }
  },
  async remove(request: Request, response: Response, next: NextFunction) {
    try { await productService.remove(String(request.params.id)); response.status(204).send() } catch (error) { next(error) }
  },
}
