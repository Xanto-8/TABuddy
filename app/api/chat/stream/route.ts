import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, context } = body as {
      messages: { role: string; content: string }[]
      context?: string
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const systemPrompt = buildSystemPrompt(context)

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ]

    const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: apiMessages,
        temperature: 0.65,
        max_tokens: 2048,
        stream: true,
      }),
    })

    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text()
      console.error('DeepSeek stream API error:', deepseekResponse.status, errorText)
      return new Response(JSON.stringify({ error: `DeepSeek API error: ${deepseekResponse.status}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const reader = deepseekResponse.body?.getReader()
    if (!reader) {
      return new Response(JSON.stringify({ error: 'No response body' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    let buffer = ''

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })

            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed) continue

              if (trimmed === 'data: [DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                continue
              }

              if (trimmed.startsWith('data: ')) {
                try {
                  const jsonStr = trimmed.slice(6)
                  const parsed = JSON.parse(jsonStr)
                  const delta = parsed.choices?.[0]?.delta
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(delta)}\n\n`))
                } catch {
                  controller.enqueue(encoder.encode(`${trimmed}\n\n`))
                }
              } else if (trimmed.startsWith('data:')) {
                try {
                  const jsonStr = trimmed.slice(5).trim()
                  const parsed = JSON.parse(jsonStr)
                  const delta = parsed.choices?.[0]?.delta
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(delta)}\n\n`))
                } catch {
                  controller.enqueue(encoder.encode(`${trimmed}\n\n`))
                }
              }
            }
          }

          if (buffer.trim()) {
            const trimmed = buffer.trim()
            if (trimmed === 'data: [DONE]') {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            } else if (trimmed.startsWith('data: ')) {
              try {
                const jsonStr = trimmed.slice(6)
                const parsed = JSON.parse(jsonStr)
                const delta = parsed.choices?.[0]?.delta
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(delta)}\n\n`))
              } catch {
                controller.enqueue(encoder.encode(`${trimmed}\n\n`))
              }
            }
          }
        } catch (error) {
          console.error('Stream processing error:', error)
        } finally {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        }
      },
      cancel() {
        reader.cancel()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat stream API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

function buildSystemPrompt(context?: string): string {
  let contextBlock = ''
  if (context) {
    try {
      const parsed = JSON.parse(context)
      contextBlock = buildClassContextBlock(parsed)
    } catch {
      contextBlock = context
    }
  }

  return `你是新东方国际教育助教团队的一名智能助手，名字叫"小T"。

## 你的性格和语气
- 温柔贴心，像一位热心的同事姐姐/哥哥在帮你，语气自然口语化
- 说话简洁明了，不啰嗦不官方，能一句话说完不说两句
- 用"~"结尾、用"哦、啦、呀、呢"等语气词，让语气更亲切
- 适当使用"咱们、我们"拉近距离，比如"咱们现在需要先完成签到哦"

## 当前上下文中包含了你活跃班级的信息，请基于这些信息回答问题。
${contextBlock || '（暂无活跃班级上下文）'}

## 你的能力范围
你只解答与助教日常工作相关的问题，包括：工作流步骤指引、资料查找、反馈写法、任务时间安排、班级数据查询等。

## 绝对禁止
- 绝不编造任何网址、链接、文档地址
- 不解答与助教工作无关的问题
- 不要用表格、markdown格式，纯文字即可
- 所有回答禁止使用加粗符号（**）`
}

function buildClassContextBlock(parsed: Record<string, unknown>): string {
  const lines: string[] = []

  if (parsed.courseName) lines.push(`- 活跃班级：${parsed.courseName}（${parsed.classType || '未知类型'}）`)
  if (parsed.currentTask) lines.push(`- 当前任务：${parsed.currentTask}`)
  if (parsed.remainingTime) lines.push(`- 课程进度：${parsed.remainingTime}`)
  if (parsed.workflowTotal !== undefined && (parsed.workflowTotal as number) > 0) {
    lines.push(`- 工作流完成：${parsed.workflowCompleted ?? 0}/${parsed.workflowTotal}`)
  }

  const classData = parsed.classData as Record<string, unknown> | undefined
  if (classData) {
    const studentCount = classData.studentCount as number | undefined
    const students = classData.students as Array<{ name: string }> | undefined
    if (studentCount && students) {
      lines.push(`- 学生人数：${studentCount}人（${students.map(s => s.name).join('、')}）`)
    }

    const quizRecords = classData.quizRecords as Array<{
      studentName: string; completion: string; wordScore?: number; wordTotal?: number; overallAccuracy?: number
    }> | undefined
    if (quizRecords && quizRecords.length > 0) {
      const completed = quizRecords.filter(r => r.completion === 'completed').length
      const notDone = quizRecords.filter(r => r.completion === 'not_done').length
      lines.push(`- 小测：已提交${completed}人，未完成${notDone}人（共${quizRecords.length}人）`)
      const retestStudents = quizRecords
        .filter(r => r.wordTotal != null && r.wordScore != null && r.wordTotal > 0 && (r.wordScore / r.wordTotal) < 0.8)
        .map(r => `${r.studentName}（单词正确率${Math.round((r.wordScore! / r.wordTotal!) * 100)}%）`)
      if (retestStudents.length > 0) {
        lines.push(`- 需重测学生：${retestStudents.join('、')}`)
      }
    }

    const hwData = classData.homeworkAssessments as Array<{
      studentName: string; completion: string; accuracy: number
    }> | undefined
    if (hwData && hwData.length > 0) {
      const completedHW = hwData.filter(r => r.completion === 'completed').length
      const notDoneHW = hwData.filter(r => r.completion === 'not_done').length
      lines.push(`- 作业：已完成${completedHW}人，未完成${notDoneHW}人（共${hwData.length}人）`)
    }
  }

  return lines.length > 0 ? lines.join('\n') : '暂无班级数据'
}
