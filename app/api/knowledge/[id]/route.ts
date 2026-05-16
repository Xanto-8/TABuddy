import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse, canManageKnowledge } from '@/lib/auth-guard'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()

  try {
    const existing = await prisma.knowledgeBaseEntry.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: '条目不存在' }, { status: 404 })
    }

    if (!canManageKnowledge(tokenUser, existing)) {
      return NextResponse.json({ error: '无权修改该条目' }, { status: 403 })
    }

    const body = await request.json()
    const updateData: Record<string, unknown> = {}

    if (body.title !== undefined) updateData.title = body.title.trim()
    if (body.content !== undefined) updateData.content = body.content
    if (body.category !== undefined) updateData.category = body.category
    if (body.tags !== undefined) updateData.tags = JSON.stringify(body.tags)
    if (body.fileName !== undefined) updateData.fileName = body.fileName
    if (body.fileType !== undefined) updateData.fileType = body.fileType

    const entry = await prisma.knowledgeBaseEntry.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ data: entry })
  } catch (error) {
    console.error('[knowledge/id] PATCH error:', error)
    return NextResponse.json({ error: '更新知识条目失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()

  try {
    const existing = await prisma.knowledgeBaseEntry.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: '条目不存在' }, { status: 404 })
    }

    if (!canManageKnowledge(tokenUser, existing)) {
      return NextResponse.json({ error: '无权删除该条目' }, { status: 403 })
    }

    await prisma.knowledgeBaseEntry.delete({ where: { id } })

    try {
      if (existing.filePath) {
        const filePath = path.join(process.cwd(), 'public', existing.filePath)
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      }
      if (existing.pdfPath) {
        const pdfPath = path.join(process.cwd(), 'public', existing.pdfPath)
        if (fs.existsSync(pdfPath)) {
          fs.unlinkSync(pdfPath)
        }
      }
    } catch (fileError) {
      console.error('[knowledge/id] 删除物理文件失败:', fileError)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[knowledge/id] DELETE error:', error)
    return NextResponse.json({ error: '删除知识条目失败' }, { status: 500 })
  }
}
