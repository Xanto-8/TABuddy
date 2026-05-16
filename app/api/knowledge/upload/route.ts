import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse } from '@/lib/auth-guard'
import {
  ensureStorageDirs,
  generateFileName,
  isAllowedFile,
  getFileExtension,
  formatFileSize,
} from '@/lib/storage-config'
import { convertToPdf, isLibreOfficeAvailable } from '@/lib/office-converter'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(request: NextRequest) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()

  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const category = (formData.get('category') as string) || ''
    const classGroupId = (formData.get('classGroupId') as string) || null
    const scope = (formData.get('scope') as string) || 'personal'

    if (!files || files.length === 0) {
      return NextResponse.json({ error: '未选择文件' }, { status: 400 })
    }

    if (files.length > 20) {
      return NextResponse.json({ error: '单次最多上传20个文件' }, { status: 400 })
    }

    const { uploadsPath } = ensureStorageDirs()
    const results: any[] = []
    let hasError = false

    for (const file of files) {
      const ext = getFileExtension(file.name)
      if (!isAllowedFile(file.name)) {
        results.push({
          fileName: file.name,
          success: false,
          error: `不支持的文件格式: ${ext}`,
        })
        hasError = true
        continue
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      if (buffer.length > 100 * 1024 * 1024) {
        results.push({
          fileName: file.name,
          success: false,
          error: '文件大小超过100MB限制',
        })
        hasError = true
        continue
      }

      const storedName = generateFileName(file.name)
      const classDir = classGroupId || 'default'
      const categoryDir = category || 'uncategorized'
      const targetDir = path.join(uploadsPath, classDir, categoryDir)

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true })
      }

      const filePath = path.join(targetDir, storedName)
      fs.writeFileSync(filePath, buffer)

      const relativePath = path
        .relative(path.join(process.cwd(), 'public'), filePath)
        .replace(/\\/g, '/')

      const entry = await prisma.knowledgeBaseEntry.create({
        data: {
          scope: classGroupId ? 'class' : 'personal',
          title: file.name.replace(ext, ''),
          content: '',
          category: category || '',
          tags: JSON.stringify([category].filter(Boolean)),
          fileName: file.name,
          fileSize: buffer.length,
          fileType: ext.replace('.', ''),
          filePath: `/${relativePath}`,
          convertStatus: ext === '.pdf' ? 'none' : 'pending',
          userId: tokenUser.userId,
          classGroupId: classGroupId || undefined,
        },
      })

      const result: any = {
        id: entry.id,
        fileName: file.name,
        fileSize: formatFileSize(buffer.length),
        fileType: ext.replace('.', ''),
        success: true,
      }

      if (ext !== '.pdf' && isLibreOfficeAvailable()) {
        convertToPdf(entry.id, filePath)
        result.convertStatus = 'pending'
      } else if (ext === '.pdf') {
        result.convertStatus = 'none'
      } else {
        result.convertStatus = 'unavailable'
      }

      results.push(result)
    }

    return NextResponse.json({
      results,
      hasError,
      libreOfficeAvailable: isLibreOfficeAvailable(),
    })
  } catch (error: any) {
    console.error('文件上传失败:', error)
    return NextResponse.json({ error: `上传失败: ${error.message}` }, { status: 500 })
  }
}
