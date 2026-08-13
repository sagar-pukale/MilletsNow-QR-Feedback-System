"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = void 0;
const notFound = (_request, response) => {
    response.status(404).json({ error: 'Route not found' });
};
exports.notFound = notFound;
