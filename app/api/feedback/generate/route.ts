import { NextRequest, NextResponse } from 'next/server'
import { generateFeedback } from '@/lib/feedback-generator'

export async function POST(request: NextRequest) {
  try {
    const { keywords, studentName, studentId, history, classContent } = await request.json()

    if (!keywords || !studentName || !studentId) {
      return NextResponse.json(
        { error: '缺少必要参数：keywords, studentName, studentId' },
        { status: 400 }
      )
    }

    if (keywords.length > 100) {
      return NextResponse.json(
        { error: '关键词过长，请控制在100字以内' },
        { status: 400 }
      )
    }

    const result = await generateFeedback({ keywords, studentName, studentId, history, classContent })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Feedback generation API error:', error)
    return NextResponse.json(
      { error: '反馈生成失败，请稍后重试' },
      { status: 500 }
    )
  }
}
