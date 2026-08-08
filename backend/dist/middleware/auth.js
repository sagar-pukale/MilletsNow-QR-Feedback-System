import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
export const authCookie = 'milletsnow_session';
export function readToken(request) {
    const cookieHeader = request.headers.cookie ?? '';
    const cookie = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${authCookie}=`));
    return cookie?.slice(authCookie.length + 1) ?? request.headers.authorization?.replace(/^Bearer\s+/i, '');
}
export function requireAuth(request, response, next) {
    const token = readToken(request);
    if (!token)
        return response.status(401).json({ error: 'Authentication required' });
    try {
        request.user = jwt.verify(token, env.JWT_SECRET);
        next();
    }
    catch {
        response.status(401).json({ error: 'Invalid or expired session' });
    }
}
