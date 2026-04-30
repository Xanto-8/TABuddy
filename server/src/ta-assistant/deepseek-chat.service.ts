import { Injectable, Logger } from '@nestjs/common'

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface DeepSeekChatRequest {
  model: string
  messages: DeepSeekMessage[]
  temperature?: number
  max_tokens?: number
}

export interface DeepSeekChatResponse {
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

export interface ChatContext {
  courseName?: string
  classType?: string
  currentTask?: string
  remainingTime?: string
  lessonLabel?: string
  workflowCompleted?: number
  workflowTotal?: number
  classData?: Record<string, unknown>
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant'
  content: string
}

@Injectable()
export class DeepseekChatService {
  private readonly logger = new Logger(DeepseekChatService.name)
  private readonly apiUrl = 'https://api.deepseek.com/v1/chat/completions'
  private readonly model = 'deepseek-chat'

  private getApiKey(): string | null {
    return process.env.DEEPSEEK_API_KEY || null
  }

  hasApiKey(): boolean {
    return this.getApiKey() !== null
  }

  async chat(
    userMessage: string,
    context?: ChatContext,
    history?: ChatHistoryItem[],
  ): Promise<string> {
    const apiKey = this.getApiKey()
    if (!apiKey) {
      this.logger.warn('DEEPSEEK_API_KEY not configured, returning fallback response')
      return this.getFallbackResponse(userMessage)
    }

    const messages: DeepSeekMessage[] = [
      { role: 'system', content: this.buildSystemPrompt(context) },
    ]

    if (history && history.length > 0) {
      const recentHistory = history.slice(-6)
      for (const h of recentHistory) {
        messages.push({ role: h.role, content: h.content })
      }
    }

    messages.push({ role: 'user', content: userMessage })

    const requestBody: DeepSeekChatRequest = {
      model: this.model,
      messages,
      temperature: 0.65,
      max_tokens: 2048,
    }

    try {
      const response = await fetch(this.apiUrl, {
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

      return content.trim()
    } catch (error) {
      this.logger.error(`DeepSeek chat API call failed: ${(error as Error).message}`)
      return '抱歉，我现在有点卡顿，你稍等一下再问我好吗？或者你可以直接在工作台里找找看相关功能~'
    }
  }

  private formatClassDataSnapshot(classData?: Record<string, unknown>): string {
    if (!classData) return ''

    const studentCount = classData.studentCount as number | undefined
    const students = classData.students as Array<{ id: string; name: string }> | undefined
    const quizRecords = classData.quizRecords as Array<{
      studentName: string
      completion: string
      wordScore?: number
      wordTotal?: number
      overallAccuracy?: number
    }> | undefined
    const homeworkAssessments = classData.homeworkAssessments as Array<{
      studentName: string
      completion: string
      accuracy: number
      handwriting: string
      hasFeedback: boolean
    }> | undefined
    const courseTasks = classData.courseTasks as Array<{
      title: string
      completed: boolean
      lesson: string
    }> | undefined
    const todayFeedbackCount = classData.todayFeedbackCount as number | undefined

    const lines: string[] = []

    if (studentCount !== undefined && students) {
      lines.push(`- 在读学生人数：${studentCount}人`)
      lines.push(`- 学生名单：${students.map(s => s.name).join('、')}`)
    }

    if (quizRecords && quizRecords.length > 0) {
      const completed = quizRecords.filter(r => r.completion === 'completed').length
      const partial = quizRecords.filter(r => r.completion === 'partial').length
      const notDone = quizRecords.filter(r => r.completion === 'not_done').length
      const withAccuracy = quizRecords.filter(r => r.overallAccuracy != null)
      const avgAccuracy = withAccuracy.length > 0
        ? Math.round(withAccuracy.reduce((sum, r) => sum + (r.overallAccuracy ?? 0), 0) / withAccuracy.length)
        : null

      lines.push(`- 小测完成情况：已提交${completed}人、部分完成${partial}人、未完成${notDone}人（共${quizRecords.length}人）`)
      if (avgAccuracy !== null) {
        lines.push(`- 小测整体准确率：${avgAccuracy}%`)
      }

      const excellent = quizRecords.filter(r => r.overallAccuracy != null && r.overallAccuracy >= 90)
      const needsWork = quizRecords.filter(r => r.overallAccuracy != null && r.overallAccuracy < 80)
      const notCompleted = quizRecords.filter(r => r.completion !== 'completed')
      if (excellent.length > 0) {
        lines.push(`- 小测表现优秀（≥90%）：${excellent.map(r => r.studentName).join('、')}`)
      }
      if (needsWork.length > 0) {
        lines.push(`- 小测需关注（<80%）：${needsWork.map(r => `${r.studentName}(${r.overallAccuracy}%)`).join('、')}`)
      }
      if (notCompleted.length > 0) {
        lines.push(`- 小测未完成学生：${notCompleted.map(r => r.studentName).join('、')}`)
      }

      const retestStudents = quizRecords
        .filter(r => r.wordTotal != null && r.wordScore != null && r.wordTotal > 0 && (r.wordScore / r.wordTotal) < 0.8)
        .map(r => {
          const acc = Math.round((r.wordScore! / r.wordTotal!) * 100)
          return `${r.studentName}（单词正确率${acc}%）`
        })
      if (retestStudents.length > 0) {
        lines.push(`- 需重测学生：${retestStudents.join('、')}`)
      }
    }

    if (homeworkAssessments && homeworkAssessments.length > 0) {
      const completedHW = homeworkAssessments.filter(r => r.completion === 'completed').length
      const partialHW = homeworkAssessments.filter(r => r.completion === 'partial').length
      const notDoneHW = homeworkAssessments.filter(r => r.completion === 'not_done').length
      const withFeedback = homeworkAssessments.filter(r => r.hasFeedback).length
      const avgAccuracy = Math.round(
        homeworkAssessments.reduce((sum, r) => sum + r.accuracy, 0) / homeworkAssessments.length
      )

      lines.push(`- 作业完成情况：已完成${completedHW}人、部分完成${partialHW}人、未完成${notDoneHW}人（共${homeworkAssessments.length}人）`)
      lines.push(`- 作业平均准确率：${avgAccuracy}%`)
      lines.push(`- 作业批改进度：已批改反馈${withFeedback}/${homeworkAssessments.length}人`)
    }

    if (courseTasks && courseTasks.length > 0) {
      const completedTasks = courseTasks.filter(t => t.completed).length
      lines.push(`- 今日课程任务进度：已完成${completedTasks}/${courseTasks.length}项`)
      for (const task of courseTasks) {
        lines.push(`  ${task.completed ? '✅' : '⬜'} ${task.title}`)
      }
    }

    if (todayFeedbackCount !== undefined) {
      lines.push(`- 今日已撰写课程反馈：${todayFeedbackCount}份`)
    }

    return lines.length > 0
      ? `\n## 当前课程数据快照（仅限本节课）\n下方数据仅包含当前课程周期内的统计结果（已按日期自动隔离历史课程数据）：\n${lines.join('\n')}`
      : ''
  }

  private buildSystemPrompt(context?: ChatContext): string {
    const contextInfo = this.formatContextInfo(context)
    const classDataSnapshot = this.formatClassDataSnapshot(context?.classData)
    const workflowTimeRule = this.buildWorkflowTimeRule(context)

    return `你是新东方国际教育助教团队的一名智能助手，名字叫"小T"。

## 你的性格和语气
- 温柔贴心，像一位热心的同事姐姐/哥哥在帮你，语气自然口语化
- 说话简洁明了，不啰嗦不官方，能一句话说完不说两句
- 用"~"结尾、用"哦、啦、呀、呢"等语气词，让语气更亲切
- 适当使用"咱们、我们"拉近距离，比如"咱们现在需要先完成签到哦"
- 不说"您好"这类过于正式的开场，直接用"嗨~"或者直接说内容
- 贴合新东方英语助教日常口吻，专业接地气

## 最重要规则：始终基于当前活跃班级回答
当前系统已经自动检测到助教的活跃班级，上下文信息如下：
${contextInfo}

你必须严格遵守以下规则：
1. 默认围绕当前活跃班级回答 — 所有回答都优先基于当前班级的信息，不需要问助教"你现在在哪个班"之类的多余问题
2. 回答开头固定格式 — 每次回复先以「你当前活跃班级是XXX（GY）哦~」或类似自然语气表明是针对哪个班级的回答
3. 检测其他班级名称时提示切换 — 如果助教在消息中提到了另一个班级的名称（与你已知的当前班级不同），先友好提示「你当前活跃班级是"XXX（GY）"，需要切换到"YYY"后再帮你查吗？」
4. 回答问题要具体关联班级情况 — 参考下面的数据快照回答
5. 所有回答严格基于当前班级真实数据，不编造、不泛泛空谈，只说项目里已有的信息
6. 所有回答禁止使用加粗符号（**），纯文字表达
7. 数据快照仅包含当前课程周期（本节课）的数据，已自动过滤历史课程记录。关于作业/小测的统计全部基于本节课内产生的数据，判断"已完成/未完成"时只针对当前课程，不参考上节课或其他日期的记录

${classDataSnapshot}

## 2小时课程工作流规则
一节课固定2小时，任务安排如下：
${workflowTimeRule}

## 你的能力范围
你只解答与助教日常工作相关的问题，包括：
✅ 工作流步骤指引 — "现在该做什么、下一步要准备什么"
✅ 资料查找 — 共享学习中心、练习答案、教案模板等
✅ 反馈写法 — 课程反馈、家长沟通建议
✅ 任务时间安排 — 课程节奏、任务优先级
✅ 班级数据查询 — 小测完成情况、作业批改进度、重点关注学生名单、重测名单等

## 专项应答要求

### 当助教问"班级小测情况怎么样"
必须基于上面数据快照中的小测数据，如实回答：
- 小测整体完成度（已提交/未完成人数）
- 小测整体表现（平均准确率，优秀学生和需关注学生）
- 未完成学生有哪些
- 整体评价和建议

### 当助教问"重点关注学生有谁"
直接根据上面数据快照，清晰列出本班需要关注的学生名单并说明原因（小测准确率低、未完成小测、作业未完成等）。

### 当助教问"重测名单、哪些人要重测"
准确给出本班需重测学生列表（单词正确率低于80%的学生），同时可提醒课后发到班级群。

### 当助教问"现在该做什么、当前任务、下一步干什么"
结合当前课程时间进度和工作流完成情况，智能给出当下最合理的任务安排建议：
- 前半节课优先处理：作业批改、作业反馈、词测小测批改、小测反馈
- 后半节课专注：课堂练习跟进、记录学生课堂表现、撰写课程综合反馈

## 知识库匹配优先级
1. 优先匹配固定知识库（网址、共享文档、练习答案、各类模板链接等）
2. 匹配不到再基于当前班级真实数据 + 2小时课程工作流规则，由你智能作答

## 绝对禁止
❌ 绝不编造任何网址、链接、文档地址 — 不知道的链接就说"这个我目前没有查到哦，建议你去共享文档中心找找看~"
❌ 不解答与助教工作无关的问题
❌ 不要用表格、markdown格式，纯文字即可
❌ 不用"亲爱的""亲"等过度亲昵称呼
❌ 不要反问助教"你在哪个班""你们班现在什么进度"等 — 你已经知道了

## 拒绝无关问题的固定话术
选一个用就好：
- "这个我可不擅长哦~我只负责解答助教工作相关的问题，比如工作流、资料查找这些~"
- "哈哈这个超出我的能力范围啦，咱们还是聊聊工作上的事情吧~"
- "我是助教工作小助手，闲聊不太在行~有什么教学工作需要我帮忙的吗？"

记住：你是助教最贴心的搭档小T，温柔、简洁、有用。你自动知道助教当前在哪个班、什么进度，不需要再问。`
  }

  private buildWorkflowTimeRule(context?: ChatContext): string {
    if (!context?.remainingTime) {
      return '前半节课（作业批改、作业反馈、词测小测批改、小测反馈）→ 后半节课（课堂练习跟进、记录学生表现、撰写课程综合反馈）'
    }

    const remaining = context.remainingTime
    const totalMinutes = 120

    let remainingMinutes = 0
    const remainMatch = remaining.match(/剩余\s*(\d+)\s*小时?\s*(\d+)?\s*分钟?/)
    if (remainMatch) {
      remainingMinutes = parseInt(remainMatch[1]) * 60 + (parseInt(remainMatch[2] || '0'))
    }
    const elapsedMinutes = totalMinutes - remainingMinutes

    if (elapsedMinutes <= 0) return '课程尚未开始，建议提前做好课前准备。'
    if (remainingMinutes <= 0) return '课程已结束，建议完成收尾工作。'

    const halfPoint = totalMinutes / 2
    const isFirstHalf = elapsedMinutes <= halfPoint

    let suggestion = ''
    if (isFirstHalf) {
      const remainingInFirstHalf = halfPoint - elapsedMinutes
      suggestion = `课程已进行约${elapsedMinutes}分钟，处于前半节课阶段（剩余约${Math.round(remainingInFirstHalf)}分钟的前半节时间）。`
      suggestion += '\n\n当前应优先处理：\n✅ 作业批改 — 检查学生作业完成情况并批改\n✅ 作业反馈 — 把批改结果反馈给学生\n✅ 词测/小测批改 — 批改课堂小测\n✅ 小测反馈 — 把小测情况告知学生'
      suggestion += '\n\n前半节课专注完成以上任务，后半节课再跟进课堂练习和学生表现记录。'
    } else {
      const elapsedInSecondHalf = elapsedMinutes - halfPoint
      suggestion = `课程已进行约${elapsedMinutes}分钟（后半节课已进行约${Math.round(elapsedInSecondHalf)}分钟），处于后半节课阶段。`
      suggestion += '\n\n当前应专注处理：\n✅ 课堂练习跟进 — 关注学生练习完成情况\n✅ 记录学生课堂表现 — 记录发言、互动、专注度等\n✅ 撰写课程综合反馈 — 整理本节课的总结反馈'
      suggestion += '\n\n如果前半节课的批改反馈任务还没做完，优先利用课间或课后补上。'
    }

    suggestion += `\n\n当前剩余课时约${remainingMinutes}分钟。`

    return suggestion
  }

  private formatContextInfo(context?: ChatContext): string {
    if (!context || (!context.courseName && !context.currentTask && !context.remainingTime && !context.classType)) {
      return '（暂无活跃班级上下文）'
    }

    const parts: string[] = []
    if (context.courseName) {
      let label = `- 当前活跃班级：${context.courseName}`
      if (context.classType) {
        label += `（${context.classType}）`
      }
      if (context.lessonLabel) {
        label += ` | ${context.lessonLabel}`
      }
      parts.push(label)
    }
    if (context.currentTask) {
      parts.push(`- 当前工作流节点：${context.currentTask}`)
    }
    if (context.remainingTime) {
      parts.push(`- 课程进度：${context.remainingTime}`)
    }
    if (context.workflowTotal !== undefined && context.workflowTotal > 0) {
      parts.push(`- 工作流完成情况：已完成 ${context.workflowCompleted ?? 0} / ${context.workflowTotal} 项`)
    }

    return parts.length > 0 ? parts.join('\n') : '（暂无活跃班级上下文）'
  }

  private getFallbackResponse(userMessage: string): string {
    if (userMessage.includes('签到') || userMessage.includes('打卡')) {
      return '签到流程很简单~打开课程管理页面，点击"签到打卡"按钮，确认学生到场情况就好啦。如果有签到问题，可以联系课程主管帮忙处理哦~'
    }
    if (userMessage.includes('反馈') && !userMessage.includes('重测')) {
      return '课程反馈模板在资源中心可以找到~里面有标准的反馈格式，按模板填写课程内容、学生表现就行，写完后直接发给家长~'
    }
    if (userMessage.includes('批改') || userMessage.includes('作业')) {
      return '批改作业的时候注意记录典型错误和学生完成情况哦~批改完记得及时录入成绩，这样后续分析学情更方便~'
    }
    if (userMessage.includes('工作流') || userMessage.includes('流程')) {
      return '按照当前课程的工作流节点顺序来做就好啦~完成一个节点记得标记已完成，这样进度一目了然~'
    }
    if (userMessage.includes('学习中心') || userMessage.includes('网址') || userMessage.includes('链接')) {
      return '这个我目前没有查到具体的链接地址哦，建议你去共享文档中心找找看，或者问问课程主管~'
    }
    if (userMessage.includes('小测') || userMessage.includes('测验') || userMessage.includes('测试')) {
      return '小测的情况需要你在工作台上传小测数据后我才能帮你分析哦~先把小测照片上传到系统里吧~'
    }
    if (userMessage.includes('重测') || userMessage.includes('留校')) {
      return '重测名单是根据小测单词正确率低于80%的学生来确定的~你先上传小测数据，我就能帮你分析哪些学生需要重测啦~'
    }
    if (userMessage.includes('关注') || userMessage.includes('重点')) {
      return '重点关注学生一般是小测准确率较低或者作业完成不太好的同学~你先上传相关数据，我来帮你分析~'
    }
    return '嗨~我是助教小T！有什么教学工作需要帮忙的吗？比如工作流步骤、资料查找、班级情况查询，我都很擅长哦~'
  }
}
