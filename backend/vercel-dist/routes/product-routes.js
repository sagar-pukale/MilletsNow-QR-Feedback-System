"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRoutes = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const product_controller_js_1 = require("../controllers/product-controller.js");
const product_image_service_js_1 = require("../services/product-image-service.js");
const allowedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_request, file, callback) => {
        if (allowedMimeTypes.has(file.mimetype)) {
            callback(null, true);
            return;
        }
        callback(new product_image_service_js_1.AppError('Only PNG, JPG, JPEG, and WEBP images are allowed.', 400));
    },
});
exports.productRoutes = (0, express_1.Router)();
function handleUpload(fieldName) {
    const middleware = upload.single(fieldName);
    return (request, response, next) => {
        middleware(request, response, (error) => {
            if (error instanceof multer_1.default.MulterError && error.code === 'LIMIT_FILE_SIZE') {
                next(new product_image_service_js_1.AppError('Product image must be 10 MB or smaller.', 400));
                return;
            }
            next(error);
        });
    };
}
exports.productRoutes.get('/', product_controller_js_1.productController.list);
exports.productRoutes.get('/:id', product_controller_js_1.productController.get);
exports.productRoutes.post('/', handleUpload('image'), product_controller_js_1.productController.create);
exports.productRoutes.post('/:id/image', handleUpload('image'), product_controller_js_1.productController.uploadImage);
exports.productRoutes.put('/:id', handleUpload('image'), product_controller_js_1.productController.update);
exports.productRoutes.delete('/:id', product_controller_js_1.productController.remove);
