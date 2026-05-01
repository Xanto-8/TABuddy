import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse, forbiddenResponse, ONLINE_THRESHOLD_MINUTES } from '@/lib/auth-guard'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()

  const isSuperAdmin = tokenUser.role === 'superadmin'
  const isOwnClass = tokenUser.role === 'classadmin' && tokenUser.classGroupId === id

  if (!isSuperAdmin && !isOwnClass) {
    return forbiddenResponse('无权查看该班级统计')
  }

  try {
    const classGroup = await prisma.classGroup.findUnique({
      where: { id },
    })

    if (!classGroup) {
      return NextResponse.json({ error: '班级不存在' }, { status: 404 })
    }

    const now = new Date()
    const threshold = new Date(now.getTime() - ONLINE_THRESHOLD_MINUTES * 60 * 1000)

    const [totalStudents, onlineStudents] = await Promise.all([
      prisma.user.count({ where: { classGroupId: id } }),
      prisma.user.count({
        where: { classGroupId: id, lastActiveAt: { gte: threshold } },
      }),
    ])

    return NextResponse.json({
      data: {
        id: classGroup.id,
        name: classGroup.name,
        totalStudents,
        onlineStudents,
      },
    })
  } catch (error) {
    console.error('[stats/class] error:', error)
    return NextResponse.json({ error: '获取班级统计失败' }, { status: 500 })
  }
}
