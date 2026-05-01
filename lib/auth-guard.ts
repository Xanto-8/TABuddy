import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './auth-utils'
import { prisma } from './prisma'

export type Role = 'superadmin' | 'classadmin' | 'student'

export interface TokenUser {
  userId: string
  username: string
  role: Role
  classGroupId: string | null
}

export function getTokenUser(request: NextRequest): TokenUser | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  const decoded = verifyToken(token)
  if (!decoded?.userId) return null
  return {
    userId: decoded.userId,
    username: decoded.username || '',
    role: (decoded.role as Role) || 'student',
    classGroupId: decoded.classGroupId || null,
  }
}

export function unauthorizedResponse(message: string = '未授权访问') {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function forbiddenResponse(message: string = '权限不足') {
  return NextResponse.json({ error: message }, { status: 403 })
}

export function requireRole(tokenUser: TokenUser | null, allowedRoles: Role[]): boolean {
  if (!tokenUser) return false
  return allowedRoles.includes(tokenUser.role)
}

export function requireOwnClassGroup(tokenUser: TokenUser | null, targetClassGroupId: string | null): boolean {
  if (!tokenUser) return false
  if (tokenUser.role === 'superadmin') return true
  if (tokenUser.role === 'classadmin' || tokenUser.role === 'student') {
    return tokenUser.classGroupId === targetClassGroupId
  }
  return false
}

export function canManageKnowledge(tokenUser: TokenUser | null, entry: { scope: string; classGroupId: string | null; userId: string | null }): boolean {
  if (!tokenUser) return false
  if (tokenUser.role === 'superadmin') return true
  if (entry.scope === 'personal') return entry.userId === tokenUser.userId
  if (entry.scope === 'class') {
    return tokenUser.role === 'classadmin' && tokenUser.classGroupId === entry.classGroupId
  }
  if (entry.scope === 'global') return false
  return false
}

export function canViewKnowledge(tokenUser: TokenUser | null, entry: { scope: string; classGroupId: string | null }): boolean {
  if (!tokenUser) return false
  if (tokenUser.role === 'superadmin') return true
  if (entry.scope === 'global') return true
  if (entry.scope === 'class') {
    return tokenUser.classGroupId === entry.classGroupId
  }
  return false
}

export async function updateLastActive(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lastActiveAt: new Date() },
    })
  } catch {
  }
}

export const ONLINE_THRESHOLD_MINUTES = 5
