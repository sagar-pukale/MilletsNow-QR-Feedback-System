"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authCookie = void 0;
exports.readToken = readToken;
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("../config/env.js");
exports.authCookie = 'milletsnow_session';
function readToken(request) {
    const cookieHeader = request.headers.cookie ?? '';
    const cookie = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${exports.authCookie}=`));
    return cookie?.slice(exports.authCookie.length + 1) ?? request.headers.authorization?.replace(/^Bearer\s+/i, '');
}
function requireAuth(request, response, next) {
    const token = readToken(request);
    if (!token)
        return response.status(401).json({ error: 'Authentication required' });
    try {
        request.user = jsonwebtoken_1.default.verify(token, env_js_1.env.JWT_SECRET);
        next();
    }
    catch {
        response.status(401).json({ error: 'Invalid or expired session' });
    }
}
