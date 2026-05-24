import { NextRequest, NextResponse } from 'next/server'
import { getTokenUser, unauthorizedResponse } from '@/lib/auth-guard'

const FALLBACK_REPORT = `## 学期学习总结

由于学习数据尚在积累中，暂无法生成完整的AI分析报告。建议至少积累3次以上小测记录和课堂反馈后再查看。

## 各模块掌握情况分析

待数据充足后可展示：词汇掌握、语法运用、作业质量、课堂参与等方面的详细分析。

## 薄弱点与重难点诊断

请持续关注学生的作业正确率变化和小测成绩趋势，及时发现需要加强的领域。

## 个性化学习建议

1. 按时完成每次课后作业和小测
2. 针对错题进行重点复习
3. 保持课堂专注，积极参与互动`

export async function POST(request: NextRequest) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()

  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return NextResponse.json({ report: FALLBACK_REPORT, source: 'fallback' })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '无效的请求数据' }, { status: 400 })
  }

  const {
    studentName,
    className,
    classType,
    quizSummary,
    homeworkSummary,
    allFeedbackContents,
    observationContents,
    absenceCount,
    totalLessons,
  } = body

  if (!studentName || !className) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
  }

  const courseTypeLabels: Record<string, string> = {
    GY: 'GY（小学基础级）',
    KET: 'KET（剑桥英语入门级）',
    PET: 'PET（剑桥英语初级）',
    FCE: 'FCE（剑桥英语中级）',
    CAE: 'CAE（剑桥英语高级）',
    CPE: 'CPE（剑桥英语熟练级）',
    OTHER: '综合课程',
  }
  const courseLabel = courseTypeLabels[classType] || classType || '综合课程'

  const quizDesc = quizSummary
    ? `小测共${quizSummary.total || 0}次，平均单词正确率${quizSummary.avgWordAccuracy || 'N/A'}%，最近一次正确率${quizSummary.latestWordAccuracy || 'N/A'}%`
    : '暂无小测数据'

  const hwDesc = homeworkSummary
    ? `作业共${homeworkSummary.total || 0}次，平均正确率${homeworkSummary.avgAccuracy || 'N/A'}%`
    : '暂无作业数据'

  const feedbackText = allFeedbackContents?.length
    ? allFeedbackContents.join('\n---\n').slice(0, 3000)
    : '暂无反馈记录'

  const observationText = observationContents?.length
    ? observationContents.join('\n').slice(0, 1000)
    : ''

  const attendanceInfo = `总课时约${totalLessons || 'N/A'}次，缺勤${absenceCount || 0}次`
  const attendanceRate = totalLessons > 0
    ? Math.round(((totalLessons - (absenceCount || 0)) / totalLessons) * 100)
    : 'N/A'

  const systemPrompt = `你是新东方少儿英语课程的资深教学顾问，专业领域为${courseLabel}。你的任务是基于提供的学生学习数据，生成一份面向家长的专业学期学习分析报告。

报告要求：
- 语言专业温暖，适合给家长阅读，客观公正
- 重点突出学生的进步和仍需努力的方向
- 薄弱点分析要具体，给出可操作的建议
- 结合${courseLabel}课程体系的阶段要求和重难点
- 使用 Markdown 格式，层级清晰`

  const userPrompt = `请基于以下学生 "${studentName}"（班级：${className}，课程：${courseLabel}）的学习数据，生成一份专业的学期学习分析报告。

## 量化数据

- ${quizDesc}
- ${hwDesc}
- ${attendanceInfo}，出勤率${attendanceRate}%
${homeworkSummary?.handwritingDistribution ? `- 书写质量分布：${JSON.stringify(homeworkSummary.handwritingDistribution)}` : ''}

## 课堂反馈记录

${feedbackText}

## 随手记

${observationText || '无'}

---

请按以下章节生成报告：

## 1. 学期学习总结（200-300字）
综合小测成绩、作业完成情况、出勤情况和课堂反馈，客观总结学生的学习状态和进步轨迹。

## 2. 各模块掌握情况分析（200-300字）
- 词汇掌握：根据历次单词测试得分分析
- 语法运用：根据语法得分和课堂表现分析
- 作业质量：根据正确率和书写质量分析
- 课堂参与：根据反馈记录和随手记分析

## 3. 薄弱点与重难点诊断（150-200字）
结合${courseLabel}课程体系要求，明确指出：
- 学生当前最需要加强的1-2个核心薄弱点
- 本阶段课程中需要重点突破的难点

## 4. 个性化学习建议（150-200字）
针对上述薄弱点，给出具体可操作的建议：
- 课后复习重点
- 练习方法和频率建议
- 家长配合建议

请直接输出 Markdown 格式的报告内容，不要包含前言或结语。`

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.65,
        max_tokens: 2048,
      }),
    })

    if (!response.ok) {
      console.error('[portfolio/analyze] DeepSeek API error:', response.status)
      return NextResponse.json({ report: FALLBACK_REPORT, source: 'fallback' })
    }

    const data = await response.json()
    const report = data.choices?.[0]?.message?.content

    if (!report || report.length < 50) {
      return NextResponse.json({ report: FALLBACK_REPORT, source: 'fallback' })
    }

    return NextResponse.json({ report, source: 'ai' })
  } catch (error) {
    console.error('[portfolio/analyze] Request error:', error)
    return NextResponse.json({ report: FALLBACK_REPORT, source: 'fallback' })
  }
}
