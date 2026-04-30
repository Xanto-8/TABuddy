import feedbackLibrary from '@/data/feedback-library.json'

const typedLibrary = feedbackLibrary as {
  behavioralTemplate: Record<string, Record<string, Record<string, string[]>>>
  grammarFeedback: Record<string, Record<string, Record<string, Record<string, string[]>>>>
}

export const CATEGORIES = Object.keys(typedLibrary.behavioralTemplate) as (keyof typeof typedLibrary.behavioralTemplate)[]
export const GRAMMAR_LEVELS = Object.keys(typedLibrary.grammarFeedback) as (keyof typeof typedLibrary.grammarFeedback)[]

export function getSubcategories(category: string): string[] {
  const cat = typedLibrary.behavioralTemplate[category]
  return cat ? Object.keys(cat) : []
}

export function getGrades(category: string, subcategory: string): string[] {
  const cat = typedLibrary.behavioralTemplate[category]
  if (!cat) return []
  const sub = cat[subcategory]
  return sub ? Object.keys(sub) : []
}

export function getLessons(level: string): string[] {
  const lvl = typedLibrary.grammarFeedback[level]
  return lvl ? Object.keys(lvl) : []
}

export function getGrammarPoints(level: string, lesson: string): string[] {
  const lvl = typedLibrary.grammarFeedback[level]
  if (!lvl) return []
  const les = lvl[lesson]
  return les ? Object.keys(les) : []
}

export function getGrammarGrades(level: string, lesson: string, grammarPoint: string): string[] {
  const lvl = typedLibrary.grammarFeedback[level]
  if (!lvl) return []
  const les = lvl[lesson]
  if (!les) return []
  const gp = les[grammarPoint]
  return gp ? Object.keys(gp) : []
}

export interface BehavioralSelection {
  subcategory: string
  grade: string
}

export interface GrammarSelection {
  lesson: string
  grammarPoint: string
  grade: string
}

export interface FeedbackInput {
  studentName: string
  className?: string
  lesson?: string
  categorySelections: Record<string, BehavioralSelection[]>
  grammarSelections: GrammarSelection[]
  level?: string
}

function pickRandom<T>(arr: T[], seed?: number): T {
  if (arr.length === 0) throw new Error('Cannot pick from empty array')
  if (arr.length === 1) return arr[0]
  if (seed !== undefined) {
    const idx = Math.abs(seed) % arr.length
    return arr[idx]
  }
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateFeedback(input: FeedbackInput): {
  content: string
  parts: { category: string; subcategory: string; grade: string; text: string }[]
} {
  const parts: { category: string; subcategory: string; grade: string; text: string }[] = []
  const usedTexts = new Set<string>()

  const categoryOrder = ['学习行为习惯', '学习能力', '其他方面']
  const sortedCategories = Object.keys(input.categorySelections).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  )

  for (const category of sortedCategories) {
    const selections = input.categorySelections[category]
    const catData = typedLibrary.behavioralTemplate[category]
    if (!catData) continue

    for (const sel of selections) {
      const variants = catData[sel.subcategory]?.[sel.grade]
      if (!variants || variants.length === 0) continue

      const available = variants.filter(v => !usedTexts.has(v))
      const pool = available.length > 0 ? available : variants

      const seed = parts.length + (input.studentName?.length || 0) + Date.now()
      let picked = pickRandom(pool, seed)
      let attempts = 0
      while (usedTexts.has(picked) && attempts < 5) {
        picked = pickRandom(pool, seed + attempts + 1)
        attempts++
      }

      usedTexts.add(picked)
      parts.push({
        category,
        subcategory: sel.subcategory,
        grade: sel.grade,
        text: picked,
      })
    }
  }

  for (const sel of input.grammarSelections) {
    const levelData = typedLibrary.grammarFeedback[input.level || '1阶']
    if (!levelData) continue
    const lessonData = levelData[sel.lesson]
    if (!lessonData) continue
    const gpData = lessonData[sel.grammarPoint]
    if (!gpData) continue
    const variants = gpData[sel.grade]
    if (!variants || variants.length === 0) continue

    const available = variants.filter(v => !usedTexts.has(v))
    const pool = available.length > 0 ? available : variants

    const seed = parts.length + (input.studentName?.length || 0) + Date.now()
    let picked = pickRandom(pool, seed)
    let attempts = 0
    while (usedTexts.has(picked) && attempts < 5) {
      picked = pickRandom(pool, seed + attempts + 1)
      attempts++
    }

    usedTexts.add(picked)
    parts.push({
      category: sel.lesson + ' · ' + sel.grammarPoint.substring(0, 30),
      subcategory: sel.grammarPoint,
      grade: sel.grade,
      text: picked,
    })
  }

  const moduleResults = parts.map(p => ({
    module: p.subcategory,
    score: p.grade === 'A' ? 90 : p.grade === 'B' ? 75 : 60,
    maxScore: 100,
    rate: p.grade === 'A' ? 0.9 : p.grade === 'B' ? 0.75 : 0.6,
    grade: p.grade as 'A' | 'B' | 'C',
  }))

  let content = `【${input.studentName}的课后学习反馈】`
  if (input.className) content += `\n班级：${input.className}`
  if (input.lesson) content += ` | 课时：${input.lesson}`
  content += '\n\n'

  if (parts.length === 0) {
    content += '暂无选择任何反馈项。'
  } else {
    const behavioralParts = parts.filter(p => categoryOrder.includes(p.category))
    const grammarParts = parts.filter(p => !categoryOrder.includes(p.category))

    if (behavioralParts.length > 0) {
      content += '一、课堂表现\n\n'
      for (const part of behavioralParts) {
        content += part.text + '\n\n'
      }
      if (grammarParts.length > 0) {
        content += '二、语法掌握情况\n\n'
        for (const part of grammarParts) {
          content += part.text + '\n\n'
        }
      }
    } else if (grammarParts.length > 0) {
      content += '一、语法掌握情况\n\n'
      for (const part of grammarParts) {
        content += part.text + '\n\n'
      }
    }

    content = content.trimEnd()
  }

  return {
    content,
    parts,
  }
}

export function generateMockResult(input: FeedbackInput) {
  return generateFeedback(input)
}
