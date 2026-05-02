import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()
  if (tokenUser.role !== 'campusadmin') return forbiddenResponse('仅校区班主任可查看校区概览')

  try {
    const binds = await prisma.campusAdminBind.findMany({
      where: { campusAdminId: tokenUser.userId, status: 'active' },
      include: {
        classAdmin: {
          select: { id: true, username: true, displayName: true, avatar: true, createdAt: true },
        },
      },
      orderBy: { bindedAt: 'desc' },
    })

    const classAdminIds = binds.map(b => b.classAdminId)

    const classAdminData = await Promise.all(
      classAdminIds.map(async (adminId) => {
        const admin = binds.find(b => b.classAdminId === adminId)?.classAdmin
        const classes = await prisma.class.findMany({
          where: { userId: adminId },
          include: {
            _count: { select: { students: true } },
          },
          orderBy: { createdAt: 'desc' },
        })

        const totalStudents = classes.reduce((sum, c) => sum + c._count.students, 0)
        const totalClasses = classes.length

        return {
          adminId,
          adminName: admin?.displayName || admin?.username || '未知',
          adminAvatar: admin?.avatar || null,
          bindedAt: binds.find(b => b.classAdminId === adminId)?.bindedAt || null,
          totalClasses,
          totalStudents,
          classes: classes.map(c => ({
            id: c.id,
            name: c.name,
            studentCount: c._count.students,
            createdAt: c.createdAt,
          })),
        }
      })
    )

    const totalClasses = classAdminData.reduce((sum, d) => sum + d.totalClasses, 0)
    const totalStudents = classAdminData.reduce((sum, d) => sum + d.totalStudents, 0)

    return NextResponse.json({
      data: {
        totalBoundAdmins: binds.length,
        totalClasses,
        totalStudents,
        adminDetails: classAdminData,
      },
    })
  } catch (error) {
    console.error('[campus/overview] error:', error)
    return NextResponse.json({ error: '获取校区概览失败' }, { status: 500 })
  }
}
