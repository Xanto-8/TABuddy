import { NextRequest, NextResponse } from 'next/server'
import { markWorkflowComplete } from '@/lib/server/workflow-reminder'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reminderId, classId, workflowNodeId } = body

    if (!reminderId || !classId || !workflowNodeId) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数：reminderId, classId, workflowNodeId' },
        { status: 400 }
      )
    }

    const result = markWorkflowComplete({ reminderId, classId, workflowNodeId })
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Workflow node reminder complete API error:', error)
    return NextResponse.json(
      { success: false, error: '标记工作流提醒完成失败' },
      { status: 500 }
    )
  }
}
