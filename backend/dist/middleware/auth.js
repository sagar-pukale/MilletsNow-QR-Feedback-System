import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
export const authCookie = 'milletsnow_session';
export function readToken(request) {
    const cookieHeader = request.headers.cookie ?? '';
    const cookie = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${authCookie}=`));
    return cookie?.slice(authCookie.length + 1) ?? request.headers.authorization?.replace(/^Bearer\s+/i, '');
}
export async function requireAuth(request, response, next) {
    const token = readToken(request);
    if (!token)
        return response.status(401).json({ error: 'Authentication required' });
    try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, role: true, status: true },
        });
        if (!user || user.status !== 'active') {
            return response.status(401).json({ error: 'Account is not authorized for this action' });
        }
        request.user = { id: user.id, email: user.email, role: user.role };
        next();
    }
    catch {
        response.status(401).json({ error: 'Invalid or expired session' });
    }
}
