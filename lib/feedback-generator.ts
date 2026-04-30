import phrasesData from '@/data/feedback-phrases.json'

interface GenerateFeedbackParams {
  keywords: string
  studentName: string
  studentId: string
  history?: string[]
  classContent?: string
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function getPhrasesByKeywords(keywords: string): {
  performanceCategory: string
  strengthCategory: string
  suggestionCategory: string
  encouragementCategory: string
} {
  const lowerKw = keywords.toLowerCase()

  const isPositive = /专注|认真|积极|进步|努力|回答|听讲|自信|举手/.test(lowerKw)
  const isNegative = /分心|调皮|拖拉|粗心|纪律|害羞/.test(lowerKw)
  const isQuiet = /内向|害羞|安静/.test(lowerKw)

  const performanceCats: string[] = []
  const strengthCats: string[] = []
  const suggestionCats: string[] = []
  const encouragementCats: string[] = []

  if (isPositive) {
    performanceCats.push('focus_positive', 'participation_positive', 'attitude_positive', 'effort_positive')
    strengthCats.push('general', 'attitude')
    suggestionCats.push('general')
    encouragementCats.push('general', 'hard_work')
  } else if (isNegative) {
    performanceCats.push('focus_needs_improvement', 'behavior_negative')
    strengthCats.push('attitude')
    suggestionCats.push('focus', 'general')
    encouragementCats.push('general')
  } else if (isQuiet) {
    performanceCats.push('participation_needs_encouragement')
    strengthCats.push('general', 'attitude')
    suggestionCats.push('confidence', 'general')
    encouragementCats.push('shy', 'general')
  } else {
    performanceCats.push('focus_positive', 'participation_positive', 'attitude_positive', 'improvement_positive')
    strengthCats.push('general', 'attitude')
    suggestionCats.push('general')
    encouragementCats.push('general', 'hard_work')
  }

  return {
    performanceCategory: pickRandom(performanceCats),
    strengthCategory: pickRandom(strengthCats),
    suggestionCategory: pickRandom(suggestionCats),
    encouragementCategory: pickRandom(encouragementCats),
  }
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateLocalFeedback(keywords: string, studentName: string): string {
  const cats = getPhrasesByKeywords(keywords)

  const performanceCat = cats.performanceCategory
  const performanceOptions = (phrasesData.classroomPerformance as unknown as Record<string, string[]>)[performanceCat]
  const performanceText = pickRandom(performanceOptions)

  const strengthOptions = (phrasesData.strengths as unknown as Record<string, string[]>)[cats.strengthCategory]
  const strengthText = pickRandom(strengthOptions)

  const suggestionOptions = (phrasesData.improvementSuggestions as unknown as Record<string, string[]>)[cats.suggestionCategory]
  const suggestionText = pickRandom(suggestionOptions)

  const encouragementOptions = (phrasesData.encouragement as unknown as Record<string, string[]>)[cats.encouragementCategory]
  const encouragementText = pickRandom(encouragementOptions)

  const transitionToStrength = pickRandom(phrasesData.transitionPhrases.to_strength)
  const transitionToSuggestion = pickRandom(phrasesData.transitionPhrases.to_suggestion)
  const transitionToEncouragement = pickRandom(phrasesData.transitionPhrases.to_encouragement)

  const name = studentName.length === 2 ? studentName : (studentName.slice(-2) || studentName)

  const templates = [
    `${name}${performanceText}。${transitionToStrength}，${strengthText}。${transitionToSuggestion.replace('XXX', '这些方面')}，${suggestionText}。${transitionToEncouragement}，${encouragementText}`,
    `今天课堂上，${name}${performanceText}。${transitionToStrength}，${strengthText}。同时，${transitionToSuggestion.replace('XXX', '平时的学习中')}，${suggestionText}。${encouragementText}`,
    `${name}今天的课堂表现：${performanceText}。${transitionToStrength}，${strengthText}。老师希望${name}${transitionToSuggestion.replace('XXX', '接下来的学习中')}，${suggestionText}。${encouragementText}`,
  ]

  let feedback = pickRandom(templates)

  const targetLength = getRandomInt(190, 210)
  if (feedback.length > targetLength + 30) {
    feedback = feedback.slice(0, targetLength + 10) + '。'
  } else if (feedback.length < targetLength - 30) {
    const extra = pickRandom(phrasesData.encouragement.general)
    feedback += ' ' + extra
  }

  return feedback
}

function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.slice(0, 30))
  const words2 = new Set(text2.slice(0, 30))
  let common = 0
  words1.forEach((w) => {
    if (words2.has(w)) common++
  })
  const total = Math.max(words1.size, words2.size)
  return total > 0 ? common / total : 0
}

function isTooSimilar(newFeedback: string, history: string[], threshold = 0.45): boolean {
  for (const h of history) {
    if (calculateSimilarity(newFeedback, h) > threshold) return true
  }
  return false
}

function regenerateUntilUnique(baseFn: () => string, history: string[], maxAttempts = 5): string {
  for (let i = 0; i < maxAttempts; i++) {
    const result = baseFn()
    if (!isTooSimilar(result, history)) return result
  }
  return baseFn()
}

export async function generateFeedback(params: GenerateFeedbackParams): Promise<{
  content: string
  usedAI: boolean
}> {
  const { keywords, studentName, studentId, history = [], classContent = '' } = params

  const historyContext = history.length > 0
    ? history.map((h, i) => `反馈${i + 1}：${h.slice(0, 100)}...`).join('\n')
    : '暂无历史反馈'

  try {
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY not configured')
    }

    const phrases = phrasesData
    const allPerformancePhrases = Object.values(phrases.classroomPerformance as Record<string, string[]>).flat().slice(0, 10).join('\n')
    const allStrengthPhrases = Object.values(phrases.strengths as Record<string, string[]>).flat().slice(0, 5).join('\n')
    const allSuggestionPhrases = Object.values(phrases.improvementSuggestions as Record<string, string[]>).flat().slice(0, 5).join('\n')
    const allEncouragementPhrases = Object.values(phrases.encouragement as Record<string, string[]>).flat().slice(0, 5).join('\n')

    const excelStyleText = [
      `课堂表现参考：\n${allPerformancePhrases}`,
      `优点点评参考：\n${allStrengthPhrases}`,
      `提升建议参考：\n${allSuggestionPhrases}`,
      `结尾鼓励参考：\n${allEncouragementPhrases}`,
    ].join('\n\n')

    const classContext = classContent.trim()
      ? `\n本节课课堂内容：\n${classContent.trim()}\n`
      : ''

    const prompt = `你是少儿英语课程的老师，请根据学生课堂关键词，生成一段190-210字的课后反馈。${classContext ? '\n注意：必须结合本节课实际课堂内容进行反馈，让反馈贴合当天上课实际情况。' : ''}

要求：
1. 完全模仿下面这段文字的语气、结构、正式度、温柔专业的老师口吻，不要AI感、不要生硬、不要模板化。
2. 结构必须是：整体表现 → 课堂状态 → 练习/掌握情况 → 具体建议 → 鼓励。
3. 语言自然、流畅、真实，像老师亲自写的，不要华丽辞藻，不要夸张。
4. 只输出最终反馈，不要任何额外解释。
${classContext ? '5. 反馈中要自然融入本节课知识点和课堂内容，避免笼统空洞，让反馈贴合当天实际教学情况。' : ''}

参考风格（必须严格模仿）：
沈彬这节课整体表现稳定，能紧跟课堂节奏学习核心知识，课堂纪律良好，全程保持专注，没有出现分心或小动作的情况。练习 11/14，说明你对本节课的知识点有基本掌握，但在细节运用上还存在提升空间。后续可以针对练习中的错题进行复盘，明确薄弱环节，回家后结合课本例题巩固相关内容，加深对知识点的理解。继续保持这份认真的学习态度，多做针对性练习，逐步提高知识运用的熟练度，下次一定能取得更理想的成绩。

学生姓名：${studentName}
课堂关键词：${keywords}${classContext}`

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
        top_p: 0.8,
        max_tokens: 350,
        presence_penalty: 0.3,
        frequency_penalty: 0.4,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      throw new Error(`DeepSeek API error: ${response.status} ${errorBody.slice(0, 200)}`)
    }

    const data = await response.json()
    let content = data.choices?.[0]?.message?.content?.trim() || ''

    if (!content || content.length < 50) {
      throw new Error('Generated content too short or empty')
    }

    content = content.replace(/^(反馈|课程反馈|评语)[：:：\s]*/i, '').trim()

    return { content, usedAI: true }
  } catch (error) {
    console.warn('AI feedback generation failed, falling back to local engine:', error)

    const localContent = regenerateUntilUnique(
      () => generateLocalFeedback(keywords, studentName),
      history.map((h) => h.slice(0, 100))
    )

    return { content: localContent, usedAI: false }
  }
}

export function generateLocalFallback(keywords: string, studentName: string, history: string[] = []): string {
  return regenerateUntilUnique(
    () => generateLocalFeedback(keywords, studentName),
    history.map((h) => h.slice(0, 100))
  )
}
