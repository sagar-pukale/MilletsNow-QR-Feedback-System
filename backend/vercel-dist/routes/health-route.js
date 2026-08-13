"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoute = void 0;
const express_1 = require("express");
exports.healthRoute = (0, express_1.Router)();
exports.healthRoute.get('/', (_request, response) => response.status(200).json({ status: 'ok' }));
