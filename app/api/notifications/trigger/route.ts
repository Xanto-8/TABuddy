import { NextRequest, NextResponse } from 'next/server'
import { triggerNotification } from '@/lib/server/notification-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scene, courseId, courseName, startTime, endTime, workflowNodeId, workflowNodeName, extraParams, context, minutesBefore } = body

    if (!scene) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数：scene' },
        { status: 400 }
      )
    }

    const result = await triggerNotification({
      scene,
      courseId,
      courseName,
      startTime,
      endTime,
      workflowNodeId,
      workflowNodeName,
      extraParams,
      context,
      minutesBefore,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Notification trigger API error:', error)
    return NextResponse.json(
      { success: false, error: '通知触发失败' },
      { status: 500 }
    )
  }
}
