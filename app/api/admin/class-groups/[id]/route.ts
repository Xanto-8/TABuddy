import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-guard'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()
  if (tokenUser.role !== 'superadmin') return forbiddenResponse('仅超级管理员可修改班级')

  try {
    const body = await request.json()
    const { name } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: '班级名称不能为空' }, { status: 400 })
    }

    const existing = await prisma.classGroup.findUnique({ where: { name } })
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: '班级名称已存在' }, { status: 409 })
    }

    const classGroup = await prisma.classGroup.update({
      where: { id },
      data: { name: name.trim() },
    })

    return NextResponse.json({ data: classGroup })
  } catch (error) {
    console.error('[admin/class-groups] PATCH error:', error)
    return NextResponse.json({ error: '更新班级失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()
  if (tokenUser.role !== 'superadmin') return forbiddenResponse('仅超级管理员可删除班级')

  try {
    const userCount = await prisma.user.count({ where: { classGroupId: id } })
    if (userCount > 0) {
      return NextResponse.json({ error: `该班级下还有 ${userCount} 名用户，无法删除` }, { status: 400 })
    }

    await prisma.classGroup.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[admin/class-groups] DELETE error:', error)
    return NextResponse.json({ error: '删除班级失败' }, { status: 500 })
  }
}
