import { NextRequest, NextResponse } from 'next/server'
import { fireWorkflowReminder } from '@/lib/server/workflow-reminder'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { classId, className, courseType, workflowNodeId, workflowNodeName } = body

    if (!classId || !workflowNodeId || !workflowNodeName) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数：classId, workflowNodeId, workflowNodeName' },
        { status: 400 }
      )
    }

    const result = await fireWorkflowReminder({
      classId,
      className: className || '',
      courseType: courseType || '',
      workflowNodeId,
      workflowNodeName,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Workflow node reminder fire API error:', error)
    return NextResponse.json(
      { success: false, error: '触发工作流提醒失败' },
      { status: 500 }
    )
  }
}
