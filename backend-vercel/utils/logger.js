"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.logger = {
    info(message, meta) {
        console.info(`[info] ${message}`, meta ?? '');
    },
    error(message, meta) {
        console.error(`[error] ${message}`, meta ?? '');
    },
};
