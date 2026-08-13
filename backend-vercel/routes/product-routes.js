"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRoutes = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const product_controller_js_1 = require("../controllers/product-controller.js");
const upload = (0, multer_1.default)({ dest: 'uploads/products' });
exports.productRoutes = (0, express_1.Router)();
exports.productRoutes.get('/', product_controller_js_1.productController.list);
exports.productRoutes.get('/:id', product_controller_js_1.productController.get);
exports.productRoutes.post('/', upload.single('image'), product_controller_js_1.productController.create);
exports.productRoutes.put('/:id', upload.single('image'), product_controller_js_1.productController.update);
exports.productRoutes.delete('/:id', product_controller_js_1.productController.remove);
