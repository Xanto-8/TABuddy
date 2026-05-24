import { NextRequest, NextResponse } from 'next/server'

const COURSE_LABELS: Record<string, string> = {
  GY: 'GY级别（启蒙/基础）',
  KET: 'KET级别（剑桥初级）',
  PET: 'PET级别（剑桥中级）',
  FCE: 'FCE级别（剑桥中高级）',
  CAE: 'CAE级别（剑桥高级）',
  CPE: 'CPE级别（剑桥精通级）',
  OTHER: '其他课程',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { classContent, courseType, className } = body

    if (!className) {
      return NextResponse.json({ error: '缺少必要参数：className' }, { status: 400 })
    }

    const courseLabel = COURSE_LABELS[courseType] || '课程'
    const courseTypeDesc = courseType === 'GY'
      ? '启蒙/基础阶段'
      : courseType === 'KET'
        ? '剑桥初级'
        : courseType === 'PET'
          ? '剑桥中级'
          : courseType === 'FCE'
            ? '剑桥中高级'
            : courseType === 'CAE'
              ? '剑桥高级'
              : courseType === 'CPE'
                ? '剑桥精通级'
                : '综合'

    const systemPrompt = `你是一位专业的新东方英语培训助教，请为${className}班（${courseLabel}）家长群撰写一条友好的微信通知文案。

格式要求：
1. 开头要有亲切的问候（如"各位家长好！"）
2. 包含今日学习内容总结
3. 包含课后作业提醒
4. 包含重点注意事项（如有）
5. 结尾要有温馨提示
6. 使用emoji让文案更亲切
7. 语言要专业但不生硬，适合家长阅读
8. 总长度控制在300字以内
9. 不要出现书名号《》
10. 不要出现"亲爱的"等过于亲昵的称呼

课堂内容参考：${classContent || '常规英语课程'}`

    const userPrompt = `请为${className}班（${courseTypeDesc}课程类型）生成长家长群通知文案。${classContent ? '今天的学习内容是：' + classContent : ''}`

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (apiKey && apiKey !== 'your_deepseek_api_key') {
      try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 600,
          }),
        })
        const data = await response.json()
        if (data.choices && data.choices[0]) {
          return NextResponse.json({ success: true, text: data.choices[0].message.content, source: 'ai' })
        }
      } catch {}
    }

    const fallbackText = `各位家长好！👋

今日${className}班学习内容：
${classContent || '完成了常规英语课程的学习，重点练习了听说读写综合能力。'}

📝 课后作业提醒：
请督促孩子完成今日课堂布置的练习册相关内容，建议每天坚持15分钟英语朗读。

💡 重点提示：
下周将有小测验，范围是近三周的学习内容，请帮助孩子做好复习准备。

如有任何问题，欢迎随时联系我。感谢各位家长的配合！🌹`

    return NextResponse.json({ success: true, text: fallbackText, source: 'template' })
  } catch {
    return NextResponse.json({ error: '生成失败' }, { status: 500 })
  }
}
