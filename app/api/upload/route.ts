import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: '没有上传文件' }, { status: 400 })
    }

    const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']
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

      return NextResponse.json(
        { error: 'Vercel 环境不支持本地存储，请配置 IMGUR_CLIENT_ID 后使用 Imgur 图床上传' },
        { status: 400 }
      )
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
