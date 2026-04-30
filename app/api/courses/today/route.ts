import { NextResponse } from 'next/server'
import { getTodayCourses } from '@/lib/server/course-service'

export async function GET() {
  try {
    const courses = getTodayCourses()
    return NextResponse.json({ success: true, data: courses })
  } catch (error) {
    console.error('Courses API error:', error)
    return NextResponse.json(
      { success: false, error: '获取课程列表失败' },
      { status: 500 }
    )
  }
}
