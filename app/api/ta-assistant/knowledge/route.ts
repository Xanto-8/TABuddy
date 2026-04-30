import { NextResponse } from 'next/server'
import { getAllKnowledgeEntries } from '@/lib/server/ta-assistant'

export async function GET() {
  try {
    const entries = getAllKnowledgeEntries()
    return NextResponse.json({ success: true, data: entries })
  } catch (error) {
    console.error('Knowledge base API error:', error)
    return NextResponse.json(
      { success: false, error: '获取知识库失败' },
      { status: 500 }
    )
  }
}
