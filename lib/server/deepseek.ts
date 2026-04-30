export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface DeepSeekRequest {
  model: string
  messages: DeepSeekMessage[]
  temperature?: number
  max_tokens?: number
}

interface DeepSeekResponse {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface ScenePromptRequest {
  scene: 'pre_class' | 'pre_class_30min' | 'pre_class_15min' | 'in_class' | 'in_class_node' | 'post_class' | 'workflow_todo' | 'system_alert'
  params: Record<string, string | number | boolean>
  context?: string
}

const apiUrl = 'https://api.deepseek.com/v1/chat/completions'
const model = 'deepseek-chat'

function getApiKey(): string | null {
  return process.env.DEEPSEEK_API_KEY || null
}

function getVisionApiKey(): string | null {
  return process.env.DEEPSEEK_VISION_API_KEY || null
}

export function hasApiKey(): boolean {
  return getApiKey() !== null
}

export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  temperature = 0.7,
  maxTokens = 1024,
): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) {
    return getFallbackText(userPrompt)
  }

  const requestBody: DeepSeekRequest = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
    max_tokens: maxTokens,
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`DeepSeek API error ${response.status}: ${errorText}`)
    }

    const data: DeepSeekResponse = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('Empty response from DeepSeek API')
    }

    return content.trim()
  } catch (error) {
    console.error('DeepSeek API call failed:', (error as Error).message)
    return getFallbackText(userPrompt)
  }
}

export async function generateNotificationCopy(scenePrompt: ScenePromptRequest): Promise<string> {
  let systemPrompt = `你是一名教育助教系统中的智能通知文案生成助手。
请根据给定的场景类型和参数，生成一句简短、亲切、适合在悬浮气泡中展示的通知文案。
要求：
- 语气亲切自然，符合教育场景
- 中文字数控制在 15-40 字之间
- 不包含 markdown 格式或特殊符号
- 直接输出文案内容，不要任何前缀说明`

  if (scenePrompt.scene === 'in_class_node') {
    systemPrompt = `你是一名课堂助教的工作流节点提醒助手。
请根据节点名称，生成一句简短、亲切、场景化的行动建议文案，提醒助教开始处理该节点任务。
要求：
- 语气亲切自然，像有经验的同事在提醒你
- 结合节点名称给出具体行动建议
- 中文字数控制在 15-40 字之间
- 不包含 markdown 格式或特殊符号
- 直接输出文案内容，不要任何前缀说明
示例：
节点"批改作业" → "现在可以开始检查学生作业啦，注意记录典型错误哦"
节点"作业反馈" → "作业批改完了，可以开始撰写反馈发送给家长啦"
节点"小测批改" → "小测时间到了，开始批改并记录成绩吧"
节点"记录小测学情" → "小测已批改完成，记得把学情数据录入系统哦"
节点"撰写课程反馈" → "课程接近尾声啦，可以开始撰写本节课的课程反馈"
节点"家长群发送当日学习内容" → "本节课重点内容讲完了，注意把控节奏，准备发送给家长"
节点"发布重测留校名单" → "需要留校重测的同学已经确定了，发布名单通知家长吧"`
  }

  const paramsDescription = Object.entries(scenePrompt.params)
    .map(([k, v]) => `${k}: ${v}`)
    .join('，')

  const contextHint = scenePrompt.context ? `\n额外上下文：${scenePrompt.context}` : ''

  const userPrompt = `场景类型：${scenePrompt.scene}
场景参数：${paramsDescription}${contextHint}
请生成一句简洁的通知文案。`

  return generateText(systemPrompt, userPrompt, 0.85, 128)
}

function getFallbackText(prompt: string): string {
  if (prompt.includes('pre_class_30min')) return '距离课程开始还有30分钟，记得提前备课打卡哦~'
  if (prompt.includes('pre_class_15min')) return '课程15分钟后开始，准备好进入教室啦'
  if (prompt.includes('pre_class') || prompt.includes('课前')) return '您有一节课程即将开始，请做好准备'
  if (prompt.includes('in_class_node')) return '现在可以开始处理当前工作流节点啦，加油哦~'
  if (prompt.includes('in_class') || prompt.includes('课中')) return '当前课程正在进行中，请关注课堂动态'
  if (prompt.includes('post_class') || prompt.includes('课后')) return '课程已结束，请及时完成课后反馈'
  if (prompt.includes('workflow') || prompt.includes('工作流')) return '您有一个待处理的工作流节点'
  if (prompt.includes('system') || prompt.includes('系统')) return '系统有新的通知提醒'
  return '您有一条新的提醒消息'
}
