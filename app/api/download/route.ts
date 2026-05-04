import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'releases', 'TABuddy Setup.exe')
    const fileBuffer = await readFile(filePath)

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-msdownload',
        'Content-Disposition': 'attachment; filename="TABuddy Setup.exe"',
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch {
    return NextResponse.json(
      { error: '安装包暂未上传服务器，请稍后再试' },
      { status: 404 }
    )
  }
}
