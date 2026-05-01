interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface DeepSeekChatRequest {
  model: string
  messages: DeepSeekMessage[]
  temperature?: number
  max_tokens?: number
}

interface DeepSeekChatResponse {
  choices: {
    message: {
      content: string
    }
  }[]
}

export interface IntentClassificationResult {
  intent: string | null
  params: Record<string, string>
  explanation: string
  confidence: number
}

const INTENT_DEFINITIONS = [
  {
    intent: 'create_class',
    description: '创建新班级',
    examples: ['创建一个新班级叫日T4', '新建KET班级', '开个新班'],
    params: [
      { name: 'className', description: '班级名称' },
      { name: 'classType', description: '班级类型（GY/KET/PET/FCE/OTHER）' },
      { name: 'students', description: '学生名单，多个学生用逗号分隔' },
    ],
  },
  {
    intent: 'set_class_type',
    description: '设置/修改班级类型',
    examples: ['把高一1班类型改为GY', '设置KET班级类型', '修改班级类型为PET'],
    params: [
      { name: 'className', description: '班级名称' },
      { name: 'classType', description: '班级类型（GY/KET/PET/FCE/OTHER）' },
    ],
  },
  {
    intent: 'add_student_to_class',
    description: '添加学生到班级',
    examples: ['把张三加入日T4班级', '添加李四到KET班', '新建学生王五并分到PET班'],
    params: [
      { name: 'studentName', description: '学生姓名' },
      { name: 'className', description: '目标班级名称' },
    ],
  },
  {
    intent: 'add_workflow_task',
    description: '添加工作流任务',
    examples: ['添加新任务：课堂小测', '给日T4班新增任务', '新建一个拍照任务'],
    params: [
      { name: 'taskName', description: '任务名称' },
      { name: 'className', description: '所属班级名称' },
    ],
  },
  {
    intent: 'reorder_workflow_tasks',
    description: '调整工作流任务顺序',
    examples: ['调整任务顺序', '把签到移到最前面', '交换任务A和任务B的位置'],
    params: [
      { name: 'className', description: '班级名称' },
      { name: 'taskOrder', description: '新的任务顺序描述' },
    ],
  },
  {
    intent: 'add_photo_reminder',
    description: '添加拍照提醒任务',
    examples: ['添加拍照提醒', '加个拍照任务', '需要拍照记录'],
    params: [
      { name: 'className', description: '班级名称' },
    ],
  },
  {
    intent: 'mark_key_student',
    description: '标记学生为重点关注',
    examples: ['标记张三为重点关注', '把李四标为重点学生', '王五需要重点关注'],
    params: [
      { name: 'studentName', description: '学生姓名' },
      { name: 'reason', description: '标记原因' },
    ],
  },
  {
    intent: 'unmark_key_student',
    description: '取消学生的重点标记',
    examples: ['取消张三的重点标记', '移除李四的关注', '不再标记王五'],
    params: [
      { name: 'studentName', description: '学生姓名' },
    ],
  },
  {
    intent: 'update_retest_list',
    description: '录入/更新重测名单',
    examples: ['录入重测名单：张三、李四', '把王五加入重测名单', '更新补考名单'],
    params: [
      { name: 'retestStudents', description: '需要重测的学生姓名，多个用逗号分隔' },
      { name: 'className', description: '班级名称' },
    ],
  },
  {
    intent: 'update_quiz_completion',
    description: '更新小测完成状态',
    examples: ['更新张三的小测状态为已完成', '把李四的小测改为未完成', '修改小测情况为部分完成'],
    params: [
      { name: 'studentName', description: '学生姓名' },
      { name: 'quizCompletion', description: '小测完成状态：已完成/部分完成/未完成' },
      { name: 'className', description: '班级名称' },
    ],
  },
  {
    intent: 'add_quiz_notes',
    description: '添加小测备注',
    examples: ['备注张三的小测表现不错', '记录小测情况：整体较好', '给KET班添加小测备注'],
    params: [
      { name: 'quizNotes', description: '备注内容' },
      { name: 'className', description: '班级名称' },
    ],
  },
]

const apiUrl = 'https://api.deepseek.com/v1/chat/completions'
const model = 'deepseek-chat'

function getApiKey(): string | null {
  return process.env.DEEPSEEK_API_KEY || null
}

function buildSystemPrompt(): string {
  const intentDescriptions = INTENT_DEFINITIONS.map((def) => {
    const examples = def.examples.map((e) => `      - "${e}"`).join('\n')
    const params = def.params.map((p) => `      - ${p.name}: ${p.description}`).join('\n')
    return `  ${def.intent}:
    描述：${def.description}
    参数：
${params}
    示例：
${examples}`
  }).join('\n\n')

  return `你是一个智能助教意图分类器。你的任务是将用户的自然语言输入分类到预定义的操作意图中。

## 可用的意图列表

${intentDescriptions}

## 额外分类规则

- greeting: 如果用户只是在打招呼（你好、嗨、早上好等），返回 intent 为 "greeting"
- question: 如果用户是在询问信息（查询、咨询、问问题等），返回 intent 为 "question"
- navigation: 如果用户想打开某个页面（打开XX、前往XX等），返回 intent 为 "navigation"
- cancel: 如果用户想取消当前操作（取消、退出、算了等），返回 intent 为 "cancel"

## 返回格式

你必须严格按照以下 JSON 格式返回，不要包含任何其他文字：

{
  "intent": "匹配的意图名称 | null",
  "params": {
    "参数名": "提取出的参数值"
  },
  "explanation": "为什么匹配这个意图的简短中文解释",
  "confidence": 0-1之间的置信度分数
}

## 规则说明

1. 如果用户输入明确匹配某个操作意图（如创建班级、添加学生等），返回对应的 intent 名称和提取的参数
2. 如果用户只是在打招呼或聊天，返回 intent 为 "greeting"
3. 如果用户在询问教学相关问题，返回 intent 为 "question"
4. 如果用户想取消操作，返回 intent 为 "cancel"
5. 如果完全不确定用户意图，返回 intent 为 null
6. 参数值尽量从原文中提取，不要编造不存在的信息
7. 对于班级名称，保持原文；对于班级类型，标准化为 GY/KET/PET/FCE/OTHER 大写形式
8. 对于小测状态，标准化为：已完成/部分完成/未完成
9. confidence 低于 0.6 时视为不可靠，intent 应设为 null`
}

export async function classifyIntentWithLLM(
  userMessage: string,
): Promise<IntentClassificationResult> {
  const apiKey = getApiKey()
  if (!apiKey) {
    return {
      intent: null,
      params: {},
      explanation: 'API Key 未配置，无法使用 LLM 分类',
      confidence: 0,
    }
  }

  const messages: DeepSeekMessage[] = [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: userMessage },
  ]

  const requestBody: DeepSeekChatRequest = {
    model,
    messages,
    temperature: 0.1,
    max_tokens: 512,
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

    const data: DeepSeekChatResponse = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('Empty response from DeepSeek API')
    }

    const cleaned = content.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    const result: IntentClassificationResult = JSON.parse(cleaned)

    if (result.confidence < 0.6) {
      return {
        intent: null,
        params: {},
        explanation: result.explanation || '置信度过低',
        confidence: result.confidence,
      }
    }

    return result
  } catch (error) {
    console.error('LLM intent classification failed:', (error as Error).message)
    return {
      intent: null,
      params: {},
      explanation: 'LLM 分类服务异常',
      confidence: 0,
    }
  }
}
