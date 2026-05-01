import { NextResponse } from 'next/server'
import { prisma } from './prisma'

const TOKEN_EXPIRY_DAYS = 7

export interface TokenPayload {
  userId: string
  username: string
  role: string
  classGroupId: string | null
}

export function generateToken(user: { id: string; username: string; role: string; classGroupId?: string | null }): string {
  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    classGroupId: user.classGroupId || null,
    exp: Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  }
  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))
    if (payload.exp < Date.now()) return null
    return { userId: payload.userId, username: payload.username, role: payload.role, classGroupId: payload.classGroupId || null }
  } catch {
    return null
  }
}

export async function getUserFromToken(token: string) {
  const decoded = verifyToken(token)
  if (!decoded) return null
  const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
  return user
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  )
}
