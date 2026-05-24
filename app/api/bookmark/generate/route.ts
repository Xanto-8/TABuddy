import { NextRequest, NextResponse } from 'next/server'
import { generateBookmarklet } from '@/lib/bookmark-script-generator'

export async function POST(request: NextRequest) {
  try {
    const { students } = await request.json()

    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: '请提供学生反馈数据' }, { status: 400 })
    }

    for (const s of students) {
      if (!s.name || !s.content) {
        return NextResponse.json({ error: '学生数据缺少 name 或 content' }, { status: 400 })
      }
    }

    const bookmarklet = generateBookmarklet(students)

    return NextResponse.json({ bookmarklet, count: students.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '生成失败' }, { status: 500 })
  }
}
