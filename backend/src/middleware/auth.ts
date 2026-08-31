import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { prisma } from '../config/prisma.js'
import { logger } from '../utils/logger.js'

export type AuthUser = { id: string; email: string; fullName: string; role: string }
export type AuthRequest = Request & { user?: AuthUser }
export const authCookie = 'milletsnow_session'

export function readToken(request: Request) {
  const cookieHeader = request.headers.cookie ?? ''
  const cookie = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${authCookie}=`))
  return cookie?.slice(authCookie.length + 1) ?? request.headers.authorization?.replace(/^Bearer\s+/i, '')
}

export async function requireAuth(request: AuthRequest, response: Response, next: NextFunction) {
  const user = await resolveAuthenticatedUser(request)
  if (!user) {
    logger.info('Authentication required', {
      method: request.method,
      path: request.originalUrl,
      origin: request.headers.origin ?? null,
      hasAuthorization: Boolean(request.headers.authorization),
      hasCookie: Boolean(request.headers.cookie),
    })
    return response.status(401).json({ error: 'Authentication required' })
  }
  request.user = user
  next()
}

export async function attachOptionalAuth(request: AuthRequest, _response: Response, next: NextFunction) {
  request.user = (await resolveAuthenticatedUser(request)) ?? undefined
  next()
}

async function resolveAuthenticatedUser(request: Request) {
  const token = readToken(request)
  if (!token) return null
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, fullName: true, role: true, status: true },
    })
    if (!user || user.status !== 'active') return null
    return { id: user.id, email: user.email, fullName: user.fullName, role: user.role }
  } catch {
    return null
  }
}
