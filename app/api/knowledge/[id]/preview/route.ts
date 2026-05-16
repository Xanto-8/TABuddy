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

    if (entry.fileType === 'pdf' && entry.filePath) {
      const pdfPath = path.join(process.cwd(), 'public', entry.filePath)
      if (fs.existsSync(pdfPath)) {
        const pdfBuffer = fs.readFileSync(pdfPath)
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline',
            'Content-Length': pdfBuffer.length.toString(),
            'X-File-Name': encodeURIComponent(entry.fileName),
            'X-Convert-Status': 'none',
          },
        })
      }
      return NextResponse.json({ error: 'PDF文件不存在' }, { status: 404 })
    }

    if (!entry.pdfPath) {
      if (entry.convertStatus === 'converting') {
        return NextResponse.json({
          error: 'PDF转换中，请稍后重试',
          converting: true,
        }, { status: 202 })
      }

      if (entry.convertStatus === 'failed') {
        return NextResponse.json({
          error: 'PDF转换失败，请确认已安装LibreOffice',
          convertFailed: true,
        }, { status: 500 })
      }

      if (entry.convertStatus === 'pending' || entry.convertStatus === 'none') {
        const { isLibreOfficeAvailable, convertToPdf } = await import('@/lib/office-converter')
        if (isLibreOfficeAvailable() && entry.filePath) {
          const fullPath = path.join(process.cwd(), 'public', entry.filePath)
          if (fs.existsSync(fullPath)) {
            convertToPdf(entry.id, fullPath)
            return NextResponse.json({
              error: '正在转换PDF，请稍后重试',
              converting: true,
            }, { status: 202 })
          }
        }
        return NextResponse.json({
          error: isLibreOfficeAvailable() ? '源文件不存在' : 'LibreOffice 未安装',
          convertFailed: !isLibreOfficeAvailable(),
        }, { status: 500 })
      }

      return NextResponse.json({ error: '预览不可用' }, { status: 404 })
    }

    if (entry.pdfPath) {
      const pdfPath = path.join(process.cwd(), 'public', entry.pdfPath)
      if (!fs.existsSync(pdfPath)) {
        return NextResponse.json({ error: 'PDF文件已被删除' }, { status: 404 })
      }

      const stream = fs.createReadStream(pdfPath)
      const stat = fs.statSync(pdfPath)

      const { readable } = stream as any
      const response = new NextResponse(readable || pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline',
          'Content-Length': stat.size.toString(),
          'X-File-Name': encodeURIComponent(entry.fileName),
          'X-Convert-Status': entry.convertStatus,
        },
      })

      return response
    }

    return NextResponse.json({ error: '预览不可用' }, { status: 404 })
  } catch (error: any) {
    console.error('预览失败:', error)
    return NextResponse.json({ error: '预览失败' }, { status: 500 })
  }
}
