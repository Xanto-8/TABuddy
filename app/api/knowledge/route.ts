import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse, canManageKnowledge } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()

  const { searchParams } = new URL(request.url)
  const scope = searchParams.get('scope') || 'all'
  const search = searchParams.get('search') || ''
  const fileType = searchParams.get('fileType') || ''
  const category = searchParams.get('category') || ''
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'
  const hasFile = searchParams.get('hasFile') || ''

  try {
    const where: Record<string, unknown> = {}

    if (tokenUser.role !== 'superadmin') {
      const ownClassId = tokenUser.classGroupId
      where.OR = [
        { scope: 'global' },
        { scope: 'personal', userId: tokenUser.userId },
        ...(ownClassId ? [{ scope: 'class', classGroupId: ownClassId }] : []),
      ]
    }

    if (scope !== 'all') {
      where.scope = scope
    }

    if (fileType) {
      where.fileType = fileType
    }

    if (category) {
      where.category = category as string
    }

    if (hasFile === 'true') {
      where.filePath = { not: '' }
    } else if (hasFile === 'false') {
      where.filePath = ''
    }

    if (search) {
      const searchWhere = {
        OR: [
          { title: { contains: search } },
          { content: { contains: search } },
          { fileName: { contains: search } },
          { category: { contains: search } },
          { tags: { contains: search } },
        ],
      }
      if (where.OR) {
        where.AND = [searchWhere]
        delete where.OR
      } else {
        where.OR = searchWhere.OR
      }
    }

    const orderBy: Record<string, string> = {}
    const sortFields = ['createdAt', 'updatedAt', 'title', 'fileSize', 'fileType']
    const safeSortBy = sortFields.includes(sortBy) ? sortBy : 'createdAt'
    const safeSortOrder = sortOrder === 'asc' ? 'asc' : 'desc'
    orderBy[safeSortBy] = safeSortOrder

    const entries = await prisma.knowledgeBaseEntry.findMany({
      where,
      orderBy,
      include: {
        user: { select: { username: true, displayName: true } },
        classGroup: { select: { name: true } },
      },
    })

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
    const { title, content, scope, classGroupId, category, tags, fileName, fileSize, fileType, filePath } = body

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
        fileName: fileName || '',
        fileSize: fileSize || 0,
        fileType: fileType || '',
        filePath: filePath || '',
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
