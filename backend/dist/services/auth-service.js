import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
export async function login(email, password) {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user?.passwordHash || user.status !== 'active' || !(await bcrypt.compare(password, user.passwordHash)))
        return null;
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
    return { token, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } };
}
export function publicUser(user) { return { id: user.id, email: user.email, fullName: user.fullName, role: user.role }; }
