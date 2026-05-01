import { NextRequest, NextResponse } from 'next/server'
import { classifyIntentWithLLM } from '@/lib/server/agent-intent-classifier'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: '缺少必要参数：message' },
        { status: 400 },
      )
    }

    if (!message.trim()) {
      return NextResponse.json(
        { success: false, error: '消息内容不能为空' },
        { status: 400 },
      )
    }

    const result = await classifyIntentWithLLM(message.trim())

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Classify intent API error:', error)
    return NextResponse.json(
      { success: false, error: '意图分类服务异常，请稍后重试' },
      { status: 500 },
    )
  }
}
