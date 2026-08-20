"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const zod_1 = require("zod");
const logger_js_1 = require("../utils/logger.js");
const errorHandler = (error, _request, response, _next) => {
    logger_js_1.logger.error('Unhandled request error:', error);
    if (error instanceof zod_1.ZodError || error?.name === 'ZodError') {
        return response.status(400).json({
            error: 'Validation failed',
            details: error.flatten?.()?.fieldErrors ?? error,
        });
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    response.status(500).json({ error: message });
};
exports.errorHandler = errorHandler;
