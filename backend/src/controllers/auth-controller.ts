import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../config/prisma.js'
import { env } from '../config/env.js'
import { authCookie, type AuthRequest } from '../middleware/auth.js'
import { login, publicUser } from '../services/auth-service.js'
import { loginSchema } from '../validators/auth-validator.js'

const cookieSameSite = env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const)
const cookieOptions = { httpOnly: true, sameSite: cookieSameSite, secure: env.NODE_ENV === 'production', maxAge: 86400000, path: '/' }
export const authController = {
  async login(request: Request, response: Response, next: NextFunction) { try { const input = loginSchema.parse(request.body); const result = await login(input.email, input.password); if (!result) return response.status(401).json({ error: 'Invalid email or password' }); response.cookie(authCookie, result.token, cookieOptions); response.json({ user: result.user, token: result.token }) } catch (error) { next(error) } },
  logout(_request: Request, response: Response) { response.clearCookie(authCookie, { httpOnly: true, sameSite: cookieSameSite, secure: env.NODE_ENV === 'production', path: '/' }); response.status(204).send() },
  async me(request: AuthRequest, response: Response, next: NextFunction) { try { const user = await prisma.user.findUnique({ where: { id: request.user?.id } }); if (!user || user.status !== 'active') return response.status(401).json({ error: 'Session is no longer valid' }); response.json({ user: publicUser(user) }) } catch (error) { next(error) } },
}
