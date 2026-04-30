'use client'

import { matchPublicKnowledgeBase } from './public-knowledge-store'

export interface KnowledgeEntry {
  id: string
  keywords: string[]
  title: string
  content: string
  type: 'link' | 'template' | 'document' | 'info'
  url?: string
  priority: number
}

const STORAGE_KEY = 'tabuddy_knowledge_base'

const DEFAULT_KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    id: 'feedback',
    keywords: ['反馈模板','反馈格式','课程反馈','反馈','家长反馈'],
    title: '课程反馈与沟通模板',
    content: '【课程反馈模板】\n📚 课程内容：今日进度 + 核心知识点\n✅ 课堂表现：学生互动 + 纪律情况\n📝 作业情况：完成率 + 准确率 + 书写评价\n📊 小测结果：完成情况 + 各维度得分\n💡 改进建议：针对性建议',
    type: 'template',
    url: 'https://learn.xdf.cn',
    priority: 5,
  },
  {
    id: 'learning_center',
    keywords: ['学习中心网址','官网','学习中心','网址','xdf','learn.xdf.cn'],
    title: '新东方学习中心',
    content: '新东方学习中心是学生在线学习平台，可查看课程、完成作业、参与小测等。请通过以下方式访问：\n1. 直接访问：https://learn.xdf.cn\n2. 建议使用 Chrome 或 Edge 浏览器\n3. 首次使用需用教务系统账号登录',
    type: 'link',
    url: 'https://learn.xdf.cn',
    priority: 4,
  },
  {
    id: 'attendance',
    keywords: ['考勤','签到','出勤','点名','未到','请假'],
    title: '考勤签到指南',
    content: '考勤记录可通过以下方式操作：\n1. 在排课表右击时间段可标记考勤\n2. 考勤状态包括：出勤、请假、缺勤\n3. 请假需提前在系统提交申请\n4. 出勤率将影响学生综合评定',
    type: 'info',
    priority: 3,
  },
  {
    id: 'class_management',
    keywords: ['创建班级','班级管理','开设班级','新班级'],
    title: '班级创建指南',
    content: '创建班级需填写以下信息：\n1. 班级名称（如：日T4）\n2. 班级类型（GY/KET/PET/FCE/OTHER/自定义）\n3. 添加学生名单\n创建完成后可配置工作流和排课信息。',
    type: 'document',
    priority: 3,
  },
  {
    id: 'retest',
    keywords: ['重测','补考','重测名单','补考名单'],
    title: '重测管理说明',
    content: '重测名单管理：\n1. 在小测管理中可标记需重测的学生\n2. 重测名单会同步显示在小测概览\n3. 完成重测后需更新小测记录状态\n4. 重测成绩同样计入学习档案',
    type: 'info',
    priority: 2,
  },
  {
    id: 'homework',
    keywords: ['作业','作业评估','批改作业','作业批改','作业评价'],
    title: '作业评估标准',
    content: '作业评估包含三个维度：\n1. 完成度：是否按时提交并完成全部内容\n2. 准确率：知识掌握程度的量化指标\n3. 书写质量：规范性和整洁度的综合评定',
    type: 'document',
    priority: 2,
  },
]

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}

function getFromStorage(): KnowledgeEntry[] {
  if (typeof window === 'undefined') return DEFAULT_KNOWLEDGE_BASE
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      saveToStorage(DEFAULT_KNOWLEDGE_BASE)
      return DEFAULT_KNOWLEDGE_BASE
    }
    return JSON.parse(stored)
  } catch {
    return DEFAULT_KNOWLEDGE_BASE
  }
}

function saveToStorage(data: KnowledgeEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    window.dispatchEvent(new CustomEvent('knowledgeBaseChanged'))
  } catch {
  }
}

export function getKnowledgeBase(): KnowledgeEntry[] {
  return getFromStorage()
}

export function getKnowledgeEntry(id: string): KnowledgeEntry | undefined {
  return getFromStorage().find(e => e.id === id)
}

export function saveKnowledgeEntry(entry: KnowledgeEntry): void {
  const entries = getFromStorage()
  const index = entries.findIndex(e => e.id === entry.id)
  if (index >= 0) {
    entries[index] = entry
  } else {
    entries.push(entry)
  }
  saveToStorage(entries)
}

export function createKnowledgeEntry(data: Omit<KnowledgeEntry, 'id'>): KnowledgeEntry {
  const entry: KnowledgeEntry = { ...data, id: generateId() }
  const entries = getFromStorage()
  entries.push(entry)
  saveToStorage(entries)
  return entry
}

export function deleteKnowledgeEntry(id: string): void {
  const entries = getFromStorage().filter(e => e.id !== id)
  saveToStorage(entries)
}

export function resetKnowledgeBase(): void {
  saveToStorage(DEFAULT_KNOWLEDGE_BASE)
}

export function matchKnowledgeBase(query: string): KnowledgeEntry | null {
  const lower = query.toLowerCase()
  const entries = getFromStorage()
  const scored = entries
    .map(entry => {
      const matchCount = entry.keywords.filter(kw => lower.includes(kw.toLowerCase())).length
      return { entry, score: matchCount * entry.priority }
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
  if (scored.length > 0) return scored[0].entry

  const publicMatch = matchPublicKnowledgeBase(query)
  return publicMatch
}
