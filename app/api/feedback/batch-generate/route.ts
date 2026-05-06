import { NextRequest, NextResponse } from 'next/server'
import { generateFeedback } from '@/lib/feedback-generator'
import { getFeedbackHistoryByStudent } from '@/lib/store'

interface BatchGenerateRequest {
  classId: string
  students: Array<{
    id: string
    name: string
    keywords: string
  }>
  classContent?: string
}

interface BatchGenerateResult {
  success: boolean
  studentId: string
  studentName: string
  content?: string
  usedAI?: boolean
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: BatchGenerateRequest = await request.json()

    if (!body.classId || !body.students || body.students.length === 0) {
      return NextResponse.json(
        { error: '缺少必要参数：classId 和 students' },
        { status: 400 }
      )
    }

    if (body.students.length > 30) {
      return NextResponse.json(
        { error: '单次批量生成最多支持30名学生' },
        { status: 400 }
      )
    }

    const results: BatchGenerateResult[] = []
    
    const maxConcurrent = 3
    const chunks: typeof body.students[] = []
    
    for (let i = 0; i < body.students.length; i += maxConcurrent) {
      chunks.push(body.students.slice(i, i + maxConcurrent))
    }

    for (const chunk of chunks) {
      const promises = chunk.map(async (student) => {
        try {
          const history = getFeedbackHistoryByStudent(student.id)
            .slice(0, 10)
            .map((r) => r.generatedContent)
            .filter(Boolean)

          const result = await generateFeedback({
            keywords: student.keywords,
            studentName: student.name,
            studentId: student.id,
            history,
            classContent: body.classContent || '',
          })

          return {
            success: true,
            studentId: student.id,
            studentName: student.name,
            content: result.content,
            usedAI: result.usedAI,
          }
        } catch (error) {
          console.error(`Failed to generate feedback for ${student.name}:`, error)
          return {
            success: false,
            studentId: student.id,
            studentName: student.name,
            error: error instanceof Error ? error.message : '生成失败',
          }
        }
      })

      const chunkResults = await Promise.all(promises)
      results.push(...chunkResults)
    }

    const successCount = results.filter((r) => r.success).length
    const failedCount = results.filter((r) => !r.success).length

    return NextResponse.json({
      success: true,
      message: `批量生成完成：成功 ${successCount} 条，失败 ${failedCount} 条`,
      data: results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failedCount,
      },
    })
  } catch (error) {
    console.error('Batch feedback generation API error:', error)
    return NextResponse.json(
      { error: '批量生成失败，请稍后重试' },
      { status: 500 }
    )
  }
}