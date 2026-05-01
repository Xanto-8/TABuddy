import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'classadmin') {
      return errorResponse('仅班级管理员可修改已绑定成员信息', 403)
    }

    const assistantId = id

    const bind = await prisma.teacherAssistantBind.findFirst({
      where: { teacherId: userId, assistantId, status: 'active' },
    })

    if (!bind) {
      return errorResponse('未找到该绑定记录或该成员不属于您的班级', 404)
    }

    const body = await request.json()
    const { password, displayName } = body

    const updateData: Record<string, string> = {}

    if (password !== undefined) {
      if (!password || password.length < 6) {
        return errorResponse('密码长度不能少于6位', 400)
      }
      updateData.password = password
    }

    if (displayName !== undefined) {
      updateData.displayName = displayName
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse('没有需要更新的字段', 400)
    }

    const updated = await prisma.user.update({
      where: { id: assistantId },
      data: updateData,
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        password: true,
        lastActiveAt: true,
        lastLoginIp: true,
        lastLoginCountry: true,
        lastLoginCity: true,
        lastLoginRegion: true,
        createdAt: true,
      },
    })

    return successResponse(updated)
  } catch (error) {
    console.error('[bound-members/id] PATCH error:', error)
    return errorResponse('更新成员信息失败', 500)
  }
}
