import { NextRequest, NextResponse } from 'next/server'
import { getConfig, updateConfig } from '@/lib/server/reminder-config'

export async function GET() {
  try {
    const config = getConfig()
    return NextResponse.json({ success: true, data: config })
  } catch (error) {
    console.error('Reminder config GET error:', error)
    return NextResponse.json(
      { success: false, error: '获取提醒配置失败' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { intervals } = body

    if (!Array.isArray(intervals)) {
      return NextResponse.json(
        { success: false, error: '参数格式错误：intervals 需要是数组' },
        { status: 400 }
      )
    }

    const config = updateConfig({ intervals })
    return NextResponse.json({ success: true, data: config })
  } catch (error) {
    console.error('Reminder config PUT error:', error)
    return NextResponse.json(
      { success: false, error: '更新提醒配置失败' },
      { status: 500 }
    )
  }
}
