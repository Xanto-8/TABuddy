import { NextRequest, NextResponse } from 'next/server'

const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID || ''
const IMGUR_API = 'https://api.imgur.com/3/image'

export async function POST(request: NextRequest) {
  try {
    if (!IMGUR_CLIENT_ID) {
      return NextResponse.json(
        { error: '未配置 Imgur Client-ID，请在项目 .env.local 文件中设置 IMGUR_CLIENT_ID' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: '没有上传文件' }, { status: 400 })
    }

    const imgurFormData = new FormData()
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    imgurFormData.append('image', base64)

    const res = await fetch(IMGUR_API, {
      method: 'POST',
      headers: {
        'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`,
      },
      body: imgurFormData,
    })

    const data = await res.json()

    if (!res.ok || !data.success) {
      throw new Error(data.data?.error || `Imgur 上传失败 (${res.status})`)
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      filePath: data.data.link,
      fileSize: file.size,
    })
  } catch (error) {
    console.error('Imgur upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '上传到图床失败' },
      { status: 500 }
    )
  }
}
