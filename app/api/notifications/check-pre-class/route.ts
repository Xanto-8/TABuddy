import { NextResponse } from 'next/server'
import { checkPreClassReminders } from '@/lib/server/notification-service'

export async function POST() {
  try {
    const reminders = await checkPreClassReminders()
    return NextResponse.json({ success: true, data: reminders })
  } catch (error) {
    console.error('Check pre-class reminders API error:', error)
    return NextResponse.json(
      { success: false, error: '检查课前提醒失败' },
      { status: 500 }
    )
  }
}
