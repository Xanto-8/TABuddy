import { NextRequest, NextResponse } from 'next/server'
import { triggerNotification } from '@/lib/server/notification-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scene, courseName, workflowNodeName, extraContext } = body

    if (!scene) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数：scene' },
        { status: 400 }
      )
    }

    const result = await triggerNotification({
      scene,
      courseName,
      workflowNodeName,
      context: extraContext,
    })

    return NextResponse.json({ success: true, data: { message: result.message } })
  } catch (error) {
    console.error('Notification preview API error:', error)
    return NextResponse.json(
      { success: false, error: '通知预览失败' },
      { status: 500 }
    )
  }
}
