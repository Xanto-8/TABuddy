import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse, canViewKnowledge, canManageKnowledge } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()

  const { searchParams } = new URL(request.url)
  const scope = searchParams.get('scope') || 'all'

  try {
    let entries

    if (tokenUser.role === 'superadmin') {
      entries = await prisma.knowledgeBaseEntry.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { username: true, displayName: true } },
          classGroup: { select: { name: true } },
        },
      })
    } else {
      const ownClassId = tokenUser.classGroupId
      entries = await prisma.knowledgeBaseEntry.findMany({
        where: {
          OR: [
            { scope: 'global' },
            { scope: 'personal', userId: tokenUser.userId },
            ...(ownClassId ? [{ scope: 'class', classGroupId: ownClassId }] : []),
          ],
        },
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { username: true, displayName: true } },
          classGroup: { select: { name: true } },
        },
      })
    }

    if (scope !== 'all') {
      entries = entries.filter(e => e.scope === scope)
    }

    return NextResponse.json({ data: entries })
  } catch (error) {
    console.error('[knowledge] GET error:', error)
    return NextResponse.json({ error: '获取知识库失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { title, content, scope, classGroupId, category, tags } = body

    if (!title || !title.trim()) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 })
    }

    const targetScope = scope || 'personal'

    if (targetScope === 'global') {
      if (tokenUser.role !== 'superadmin') {
        return NextResponse.json({ error: '仅超级管理员可创建全局知识库' }, { status: 403 })
      }
    }

    if (targetScope === 'class') {
      const targetClassId = classGroupId || tokenUser.classGroupId
      if (!targetClassId) {
        return NextResponse.json({ error: '班级专属知识库需要指定班级' }, { status: 400 })
      }
      if (tokenUser.role !== 'superadmin' && tokenUser.classGroupId !== targetClassId) {
        return NextResponse.json({ error: '无权为该班级创建知识库' }, { status: 403 })
      }
    }

    const entry = await prisma.knowledgeBaseEntry.create({
      data: {
        scope: targetScope,
        title: title.trim(),
        content: content || '',
        category: category || '',
        tags: tags ? JSON.stringify(tags) : '[]',
        userId: targetScope === 'personal' ? tokenUser.userId : (targetScope === 'class' ? tokenUser.userId : null),
        classGroupId: targetScope === 'class' ? (classGroupId || tokenUser.classGroupId) : null,
      },
    })

    return NextResponse.json({ data: entry }, { status: 201 })
  } catch (error) {
    console.error('[knowledge] POST error:', error)
    return NextResponse.json({ error: '创建知识条目失败' }, { status: 500 })
  }
}
