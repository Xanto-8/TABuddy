import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse, getBody } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function computeExpiresAt(validPeriod: string): Date | null {
  if (validPeriod === 'permanent') return null
  const now = new Date()
  if (validPeriod === '24h') return new Date(now.getTime() + 24 * 60 * 60 * 1000)
  if (validPeriod === '7d') return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  return null
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'classadmin') {
      return errorResponse('Only class admins can generate invite codes', 403)
    }

    const body = await getBody<{ validPeriod?: string }>(request)
    const validPeriod = body?.validPeriod || 'permanent'

    if (!['permanent', '24h', '7d'].includes(validPeriod)) {
      return errorResponse('Invalid valid period', 400)
    }

    const expiresAt = computeExpiresAt(validPeriod)

    let inviteCode = generateInviteCode()
    let existing = await prisma.teacherAssistantBind.findFirst({ where: { inviteCode } })
    while (existing) {
      inviteCode = generateInviteCode()
      existing = await prisma.teacherAssistantBind.findFirst({ where: { inviteCode } })
    }

    const existingSource = await prisma.teacherAssistantBind.findFirst({
      where: { teacherId: userId, assistantId: null, status: 'active' },
    })

    if (existingSource) {
      const updated = await prisma.teacherAssistantBind.update({
        where: { id: existingSource.id },
        data: {
          inviteCode,
          validPeriod,
          expiresAt,
          createdAt: new Date(),
        },
      })
      return successResponse(updated)
    }

    const source = await prisma.teacherAssistantBind.create({
      data: {
        teacherId: userId,
        inviteCode,
        validPeriod,
        expiresAt,
        status: 'active',
      },
    })

    return successResponse(source, 201)
  } catch (error) {
    console.error('Generate invite code error:', error)
    return errorResponse('Failed to generate invite code', 500)
  }
}
