import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: '没有上传文件' }, { status: 400 })
    }

    const allowedExtensions = [
      '.pdf', '.doc', '.docx', '.docm', '.dotx',
      '.xls', '.xlsx', '.xlsm', '.xlsb', '.csv', '.ods', '.xml',
      '.ppt', '.pptx', '.pptm', '.potx',
      '.txt', '.md',
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg',
    ]
    const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] || ''
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json({ error: '不支持的文件格式' }, { status: 400 })
    }

    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: '文件大小不能超过 50MB' }, { status: 400 })
    }

    const isVercel = process.env.VERCEL === '1'

    if (isVercel) {
      const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID || ''
      if (IMGUR_CLIENT_ID) {
        const imgurRes = await uploadToImgur(file, IMGUR_CLIENT_ID)
        return NextResponse.json({
          success: true,
          fileName: file.name,
          filePath: imgurRes.data.link,
          fileSize: file.size,
        })
      }

      const maxDataSize = 1024 * 1024
      if (file.size > maxDataSize) {
        return NextResponse.json(
          { error: `Vercel 环境未配置 Imgur，仅支持 1MB 以内的文件直接嵌入，当前文件 ${(file.size / 1024 / 1024).toFixed(1)}MB` },
          { status: 400 }
        )
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64 = buffer.toString('base64')
      const mimeType = getMimeType(ext)
      const dataUrl = `data:${mimeType};base64,${base64}`

      return NextResponse.json({
        success: true,
        fileName: file.name,
        filePath: dataUrl,
        fileSize: file.size,
      })
    }

    const { writeFile, mkdir } = await import('fs/promises')
    const path = await import('path')

    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    const timestamp = Date.now()
    const safeName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const filePath = path.join(uploadDir, safeName)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    return NextResponse.json({
      success: true,
      fileName: file.name,
      filePath: `/uploads/${safeName}`,
      fileSize: file.size,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: '上传失败' }, { status: 500 })
  }
}

async function uploadToImgur(file: File, clientId: string) {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const base64 = buffer.toString('base64')
  const imgurFormData = new FormData()
  imgurFormData.append('image', base64)

  const res = await fetch('https://api.imgur.com/3/image', {
    method: 'POST',
    headers: { Authorization: `Client-ID ${clientId}` },
    body: imgurFormData,
  })
  const data = await res.json()
  if (!res.ok || !data.success) {
    throw new Error(data.data?.error || 'Imgur 上传失败')
  }
  return data.data
}

const MIME_MAP: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.docm': 'application/vnd.ms-word.document.macroEnabled.12',
  '.dotx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xlsm': 'application/vnd.ms-excel.sheet.macroEnabled.12',
  '.xlsb': 'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
  '.csv': 'text/csv',
  '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
  '.xml': 'application/xml',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.pptm': 'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
  '.potx': 'application/vnd.openxmlformats-officedocument.presentationml.template',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
}

function getMimeType(ext: string): string {
  return MIME_MAP[ext] || 'application/octet-stream'
}
