"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.publicUser = publicUser;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_js_1 = require("../config/prisma.js");
const env_js_1 = require("../config/env.js");
async function login(email, password) {
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPassword = password.trim();
    const user = await prisma_js_1.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user?.passwordHash || user.status !== 'active' || !(await bcryptjs_1.default.compare(normalizedPassword, user.passwordHash))) {
        return null;
    }
    await prisma_js_1.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, env_js_1.env.JWT_SECRET, {
        expiresIn: env_js_1.env.JWT_EXPIRES_IN,
    });
    return { token, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } };
}
function publicUser(user) {
    return { id: user.id, email: user.email, fullName: user.fullName, role: user.role };
}
