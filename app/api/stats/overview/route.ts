import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse, forbiddenResponse, ONLINE_THRESHOLD_MINUTES } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()
  if (tokenUser.role !== 'superadmin') return forbiddenResponse('仅超级管理员可查看全站统计')

  try {
    const now = new Date()
    const threshold = new Date(now.getTime() - ONLINE_THRESHOLD_MINUTES * 60 * 1000)

    const [totalUsers, onlineUsers, classGroups] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { lastActiveAt: { gte: threshold } } }),
      prisma.classGroup.findMany({
        include: {
          _count: { select: { users: true } },
        },
      }),
    ])

    const classStats = await Promise.all(
      classGroups.map(async (cg) => {
        const onlineCount = await prisma.user.count({
          where: { classGroupId: cg.id, lastActiveAt: { gte: threshold } },
        })
        return {
          id: cg.id,
          name: cg.name,
          totalStudents: cg._count.users,
          onlineStudents: onlineCount,
        }
      })
    )

    return NextResponse.json({
      data: {
        totalUsers,
        onlineUsers,
        classGroups: classStats,
      },
    })
  } catch (error) {
    console.error('[stats/overview] error:', error)
    return NextResponse.json({ error: '获取统计数据失败' }, { status: 500 })
  }
}
