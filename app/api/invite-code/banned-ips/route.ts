import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest, errorResponse, successResponse } from '@/lib/api-data-utils'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'classadmin') {
      return errorResponse('仅班级管理员可查看封禁记录', 403)
    }

    const bannedIPs = await prisma.bannedIP.findMany({
      where: { bannedBy: userId },
      orderBy: { createdAt: 'desc' },
    })

    const result = bannedIPs.map(b => ({
      id: b.id,
      ip: b.ip,
      reason: b.reason,
      createdAt: b.createdAt,
    }))

    return successResponse(result)
  } catch (error) {
    console.error('[invite-code/banned-ips] GET error:', error)
    return errorResponse('获取封禁列表失败', 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'classadmin') {
      return errorResponse('仅班级管理员可撤销封禁', 403)
    }

    const { ip, id } = await request.json()
    if (!ip && !id) {
      return errorResponse('缺少IP或ID', 400)
    }

    const whereClause = id ? { id } : { ip }
    const record = await prisma.bannedIP.findFirst({ where: whereClause })

    if (!record) {
      return errorResponse('该封禁记录不存在', 404)
    }

    if (record.bannedBy !== userId) {
      return errorResponse('只能撤销自己封禁的IP', 403)
    }

    if (id) {
      await prisma.bannedIP.delete({ where: { id } })
    } else {
      await prisma.bannedIP.delete({ where: { ip } })
    }

    return NextResponse.json({
      data: { message: `IP ${record.ip} 已解封` },
    })
  } catch (error) {
    console.error('[invite-code/banned-ips] DELETE error:', error)
    return errorResponse('撤销封禁失败', 500)
  }
}
