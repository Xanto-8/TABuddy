import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()
  if (tokenUser.role !== 'superadmin') return forbiddenResponse('仅超级管理员可管理班级')

  try {
    const classGroups = await prisma.classGroup.findMany({
      include: {
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    const result = classGroups.map(cg => ({
      id: cg.id,
      name: cg.name,
      createdAt: cg.createdAt,
      userCount: cg._count.users,
    }))

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('[admin/class-groups] GET error:', error)
    return NextResponse.json({ error: '获取班级列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()
  if (tokenUser.role !== 'superadmin') return forbiddenResponse('仅超级管理员可创建班级')

  try {
    const body = await request.json()
    const { name } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: '班级名称不能为空' }, { status: 400 })
    }

    const existing = await prisma.classGroup.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: '班级名称已存在' }, { status: 409 })
    }

    const classGroup = await prisma.classGroup.create({
      data: { name: name.trim() },
    })

    return NextResponse.json({ data: classGroup }, { status: 201 })
  } catch (error) {
    console.error('[admin/class-groups] POST error:', error)
    return NextResponse.json({ error: '创建班级失败' }, { status: 500 })
  }
}
