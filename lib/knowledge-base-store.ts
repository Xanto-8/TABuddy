import { getCache, isCacheLoaded, triggerSync } from './store'

export interface KnowledgeEntry {
  id: string
  keywords: string[]
  title: string
  content: string
  type: 'link' | 'template' | 'document' | 'info'
  url?: string
  priority: number
}

let localFallback: KnowledgeEntry[] = []

const defaultEntries: KnowledgeEntry[] = [
  { id: 'kb-1', keywords: ['备课', '教案', '教学设计'], title: '备课指南', content: '备课是教学工作的首要环节...', type: 'template', url: '', priority: 5 },
  { id: 'kb-2', keywords: ['课堂', '互动', '管理'], title: '课堂互动技巧', content: '通过提问、小组讨论等方式提高学生参与度...', type: 'document', url: '', priority: 4 },
  { id: 'kb-3', keywords: ['作业', '批改', '反馈'], title: '作业批改标准', content: '作业批改应及时、准确、有针对性...', type: 'info', url: '', priority: 3 },
  { id: 'kb-4', keywords: ['家长', '沟通', '联系'], title: '家长沟通话术模板', content: '尊敬的家长您好，我是xx老师...', type: 'template', url: '', priority: 4 },
  { id: 'kb-5', keywords: ['考试', '评估', '分析'], title: '学情分析报告模板', content: '本次考试整体情况：...', type: 'template', url: '', priority: 3 },
  { id: 'kb-6', keywords: ['教学', '资源', '网站'], title: '教学资源网站汇总', content: '1. 学科网\n2. 国家中小学智慧教育平台\n3. 一师一优课', type: 'link', url: 'https://www.zxxk.com', priority: 2 },
  { id: 'kb-7', keywords: ['班会', '主题', '活动'], title: '班会主题设计方案', content: '月度班会主题设计方案汇总...', type: 'document', url: '', priority: 3 },
  { id: 'kb-8', keywords: ['学生', '心理', '辅导'], title: '学生心理辅导指南', content: '常见学生心理问题及应对策略...', type: 'document', url: '', priority: 4 },
  { id: 'kb-9', keywords: ['AI', '教学', '工具'], title: 'AI辅助教学工具推荐', content: '1. 文心一言\n2. Kimi\n3. 通义千问', type: 'info', url: '', priority: 2 },
  { id: 'kb-10', keywords: ['课程', '标准', '大纲'], title: '课程大纲编写规范', content: '课程大纲应包括：课程目标、内容安排、教学方法、考核方式...', type: 'document', url: '', priority: 3 },
  { id: 'kb-11', keywords: ['板书', '设计', '技巧'], title: '板书设计技巧', content: '优秀的板书设计应做到：重点突出、结构清晰、布局合理...', type: 'info', url: '', priority: 2 },
  { id: 'kb-12', keywords: ['安全教育', '预案', '应急'], title: '班级安全应急预案', content: '一、火灾逃生\n二、地震避险\n三、突发疾病...', type: 'document', url: '', priority: 5 },
]

function getLocalKnowledgeBase(): KnowledgeEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem('tabuddy_knowledge_base')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch { }
  return []
}

function saveLocalKnowledgeBase(entries: KnowledgeEntry[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('tabuddy_knowledge_base', JSON.stringify(entries))
  } catch { }
}

export function getKnowledgeBase(): KnowledgeEntry[] {
  const local = getLocalKnowledgeBase()
  if (local.length > 0) {
    localFallback = [...local.map(e => ({ ...e }))]
  }
  if (isCacheLoaded()) {
    const cache = getCache()
    const cacheEntries = cache.knowledgeEntries as unknown as KnowledgeEntry[]
    if (localFallback.length > 0) {
      cacheEntries.length = 0
      cacheEntries.push(...localFallback.map(e => ({ ...e })))
    } else if (cacheEntries.length === 0) {
      defaultEntries.forEach(e => cacheEntries.push({ ...e }))
    }
    return cacheEntries
  }
  if (localFallback.length > 0) {
    return localFallback
  }
  return defaultEntries.map(e => ({ ...e }))
}

export function addKnowledgeEntry(entry: KnowledgeEntry): void {
  const entries = getKnowledgeBase()
  entries.push(entry)
  saveLocalKnowledgeBase([...entries])
  if (isCacheLoaded()) {
    triggerSync()
  }
}

export function updateKnowledgeEntry(updated: KnowledgeEntry): void {
  const entries = getKnowledgeBase()
  const index = entries.findIndex(e => e.id === updated.id)
  if (index !== -1) {
    entries[index] = updated
    saveLocalKnowledgeBase([...entries])
    if (isCacheLoaded()) {
      triggerSync()
    }
  }
}

export function deleteKnowledgeEntry(id: string): void {
  const entries = getKnowledgeBase()
  const index = entries.findIndex(e => e.id === id)
  if (index !== -1) {
    entries.splice(index, 1)
    saveLocalKnowledgeBase([...entries])
    const loaded = isCacheLoaded()
    if (loaded) {
      triggerSync()
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('knowledgeBaseChanged'))
    }
  }
}

export function getEntryById(id: string): KnowledgeEntry | undefined {
  return getKnowledgeBase().find(e => e.id === id)
}

export function saveKnowledgeEntry(entry: KnowledgeEntry): void {
  const entries = getKnowledgeBase()
  const index = entries.findIndex(e => e.id === entry.id)
  if (index !== -1) {
    entries[index] = entry
    saveLocalKnowledgeBase([...entries])
    if (isCacheLoaded()) {
      triggerSync()
    }
  } else {
    addKnowledgeEntry(entry)
  }
}

export function createKnowledgeEntry(entry: KnowledgeEntry): void {
  addKnowledgeEntry(entry)
}

export function resetKnowledgeBase(): void {
  const entries = defaultEntries.map(e => ({ ...e }))
  saveLocalKnowledgeBase(entries)
  if (isCacheLoaded()) {
    const cache = getCache()
    const cacheEntries = cache.knowledgeEntries as unknown as KnowledgeEntry[]
    cacheEntries.length = 0
    cacheEntries.push(...entries)
    triggerSync()
  }
}

export function matchKnowledgeBase(query: string): KnowledgeEntry[] {
  if (!query) return []
  const q = query.toLowerCase()
  return getKnowledgeBase().filter(entry =>
    entry.keywords.some(k => k.toLowerCase().includes(q)) ||
    entry.title.toLowerCase().includes(q) ||
    entry.content.toLowerCase().includes(q)
  )
}
