import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, requireRole, forbiddenResponse, unauthorizedResponse } from '@/lib/auth-guard'
import { errorResponse, successResponse } from '@/lib/api-data-utils'

function generateTeacherCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST(request: NextRequest) {
  try {
    const tokenUser = getTokenUser(request)
    if (!tokenUser) return unauthorizedResponse()
    if (!requireRole(tokenUser, ['superadmin', 'classadmin'])) return forbiddenResponse('仅限管理员生成老师注册码')

    const existingActive = await prisma.teacherRegCode.findFirst({
      where: { creatorId: tokenUser.userId, isActive: true },
    })

    if (existingActive) {
      await prisma.teacherRegCode.update({
        where: { id: existingActive.id },
        data: { isActive: false },
      })
    }

    let code = generateTeacherCode()
    let existing = await prisma.teacherRegCode.findUnique({ where: { code } })
    while (existing) {
      code = generateTeacherCode()
      existing = await prisma.teacherRegCode.findUnique({ where: { code } })
    }

    const teacherRegCode = await prisma.teacherRegCode.create({
      data: {
        code,
        creatorId: tokenUser.userId,
        isActive: true,
      },
    })

    return successResponse({
      id: teacherRegCode.id,
      code: teacherRegCode.code,
      isActive: teacherRegCode.isActive,
      createdAt: teacherRegCode.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('Generate teacher code error:', error)
    return errorResponse('生成失败', 500)
  }
}
