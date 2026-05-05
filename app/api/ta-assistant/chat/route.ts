import { NextRequest, NextResponse } from 'next/server'
import { chat } from '@/lib/server/ta-assistant'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, courseName, classType, currentTask, remainingTime, lessonLabel, workflowCompleted, workflowTotal, classData, history } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: '缺少必要参数：message' },
        { status: 400 }
      )
    }

    const result = await chat({
      message,
      courseName,
      classType,
      currentTask,
      remainingTime,
      lessonLabel,
      workflowCompleted,
      workflowTotal,
      classData,
      history,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Ta assistant chat API error:', error)
    return NextResponse.json(
      { success: false, error: '聊天服务异常，请稍后重试' },
      { status: 500 }
    )
  }
}
