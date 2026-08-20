"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const prisma_js_1 = require("../config/prisma.js");
const env_js_1 = require("../config/env.js");
const auth_js_1 = require("../middleware/auth.js");
const auth_service_js_1 = require("../services/auth-service.js");
const auth_validator_js_1 = require("../validators/auth-validator.js");
const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: env_js_1.env.NODE_ENV === 'production', maxAge: 86400000, path: '/' };
exports.authController = {
    async login(request, response, next) { try {
        const input = auth_validator_js_1.loginSchema.parse(request.body);
        const result = await (0, auth_service_js_1.login)(input.email, input.password);
        if (!result)
            return response.status(401).json({ error: 'Invalid email or password' });
        response.cookie(auth_js_1.authCookie, result.token, cookieOptions);
        response.json({ user: result.user });
    }
    catch (error) {
        next(error);
    } },
    logout(_request, response) { response.clearCookie(auth_js_1.authCookie, { httpOnly: true, sameSite: 'lax', secure: env_js_1.env.NODE_ENV === 'production', path: '/' }); response.status(204).send(); },
    async me(request, response, next) { try {
        const user = await prisma_js_1.prisma.user.findUnique({ where: { id: request.user?.id } });
        if (!user || user.status !== 'active')
            return response.status(401).json({ error: 'Session is no longer valid' });
        response.json({ user: (0, auth_service_js_1.publicUser)(user) });
    }
    catch (error) {
        next(error);
    } },
};
