import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()
  if (tokenUser.role !== 'campusadmin') return forbiddenResponse('仅校区班主任可查看')

  try {
    const binds = await prisma.campusAdminBind.findMany({
      where: { campusAdminId: tokenUser.userId, status: 'active' },
      select: { classAdminId: true },
    })

    const classAdminIds = binds.map(b => b.classAdminId)
    if (classAdminIds.length === 0) {
      return NextResponse.json({ data: { codes: [] } })
    }

    const codes = await prisma.teacherRegCode.findMany({
      where: { creatorId: { in: classAdminIds } },
      include: {
        creator: { select: { id: true, displayName: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const mapped = codes.map(c => ({
      id: c.id,
      code: c.code,
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
      classAdmin: { id: c.creator.id, displayName: c.creator.displayName, username: c.creator.username },
    }))

    return NextResponse.json({ data: { codes: mapped } })
  } catch (error) {
    console.error('[campus/teacher-codes] error:', error)
    return NextResponse.json({ error: '获取老师注册码失败' }, { status: 500 })
  }
}
