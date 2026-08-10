import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/prisma.js'
import { env } from '../config/env.js'

export async function login(email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim()
  const normalizedPassword = password.trim()
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (!user?.passwordHash || user.status !== 'active' || !(await bcrypt.compare(normalizedPassword, user.passwordHash))) {
    return null
  }
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  })
  return { token, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } }
}

export function publicUser(user: { id: string; email: string; fullName: string; role: string }) {
  return { id: user.id, email: user.email, fullName: user.fullName, role: user.role }
}
