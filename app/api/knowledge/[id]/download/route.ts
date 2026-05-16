import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse, canViewKnowledge } from '@/lib/auth-guard'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()

  try {
    const entry = await prisma.knowledgeBaseEntry.findUnique({
      where: { id },
      include: { classGroup: true },
    })

    if (!entry) {
      return NextResponse.json({ error: '文档不存在' }, { status: 404 })
    }

    if (!canViewKnowledge(tokenUser, entry)) {
      return NextResponse.json({ error: '无权访问该文档' }, { status: 403 })
    }

    if (!entry.filePath) {
      return NextResponse.json({ error: '文件路径不存在' }, { status: 404 })
    }

    const absolutePath = path.join(process.cwd(), 'public', entry.filePath)
    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json({ error: '原文件已被删除' }, { status: 404 })
    }

    const stat = fs.statSync(absolutePath)
    const fileBuffer = fs.readFileSync(absolutePath)

    const fileName = encodeURIComponent(entry.fileName || path.basename(entry.filePath))
    const ext = path.extname(entry.fileName || entry.filePath).toLowerCase()
    const mimeMap: Record<string, string> = {
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.pdf': 'application/pdf',
    }
    const contentType = mimeMap[ext] || 'application/octet-stream'

    const rangeHeader = request.headers.get('range')
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1
      const chunkSize = end - start + 1

      const chunk = fileBuffer.subarray(start, end + 1)
      return new NextResponse(chunk, {
        status: 206,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Content-Length': chunkSize.toString(),
          'Accept-Ranges': 'bytes',
        },
      })
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': stat.size.toString(),
        'Accept-Ranges': 'bytes',
      },
    })
  } catch (error: any) {
    console.error('下载失败:', error)
    return NextResponse.json({ error: '下载失败' }, { status: 500 })
  }
}
