"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productController = void 0;
const product_service_js_1 = require("../services/product-service.js");
exports.productController = {
    async list(request, response, next) {
        try {
            response.json(await product_service_js_1.productService.list(request.query));
        }
        catch (error) {
            next(error);
        }
    },
    async get(request, response, next) {
        try {
            const product = await product_service_js_1.productService.get(String(request.params.id));
            if (!product)
                return response.status(404).json({ error: 'Product not found' });
            response.json(product);
        }
        catch (error) {
            next(error);
        }
    },
    async create(request, response, next) {
        try {
            response.status(201).json(await product_service_js_1.productService.create(request.body, request.file));
        }
        catch (error) {
            next(error);
        }
    },
    async update(request, response, next) {
        try {
            response.json(await product_service_js_1.productService.update(String(request.params.id), request.body, request.file));
        }
        catch (error) {
            next(error);
        }
    },
    async uploadImage(request, response, next) {
        try {
            response.json(await product_service_js_1.productService.uploadImage(String(request.params.id), request.file));
        }
        catch (error) {
            next(error);
        }
    },
    async remove(request, response, next) {
        try {
            await product_service_js_1.productService.remove(String(request.params.id));
            response.status(204).send();
        }
        catch (error) {
            next(error);
        }
    },
};
