'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { matchKnowledgeBase, KnowledgeEntry } from '@/lib/knowledge-base-store'
import { loadPublicKnowledgeBase } from '@/lib/public-knowledge-store'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { httpClient } from '@/lib/api/client'
import { useProgress } from '@/components/providers/progress-provider'
import {
  getClassSchedules,
  getStudentsByClass,
  getQuizRecordsByClass,
  getHomeworkAssessmentsByClass,
  getCourseTasksByClassAndDate,
  getFeedbackHistory,
  getCurrentClassByTime,
} from '@/lib/store'
import { getWorkflowTodoStats } from '@/lib/workflow-store'
import { processAgentInput, isOperationIntent } from '@/lib/agent/engine'
import { MessageCircle, X, Send, Sparkles, ChevronDown, Trash2, Sun, Moon, Navigation } from 'lucide-react'
import type { AgentCardData } from '@/lib/agent/types'
import { AgentStepCard } from '@/components/agent/agent-step-card'



interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  url?: string
  type?: 'text' | 'knowledge'
  cardData?: AgentCardData
}

interface KnowledgeMatchResponse {
  source: 'knowledge_base'
  entry: KnowledgeEntry
}

interface AiResponse {
  source: 'ai'
  reply: string
}

type ChatApiResponse = KnowledgeMatchResponse | AiResponse

const STORAGE_KEY = 'tabuddy_chat_history'
const QUICK_QUESTIONS = [
  { label: '现在该做什么', icon: Sparkles },
  { label: '添加任务', icon: null },
  { label: '小测情况怎么样', icon: null },
  { label: '重点关注学生', icon: null },
  { label: '重测名单', icon: null },
  { label: '学习中心网址', icon: null },
  { label: '反馈模板', icon: null },
]

const AGENT_OPERATION_LABELS: Record<string, string> = {
  create_class: '创建班级',
  set_class_type: '设置班级类型',
  add_student_to_class: '添加学生到班级',
  add_workflow_task: '添加工作流任务',
  reorder_workflow_tasks: '调整任务顺序',
  add_photo_reminder: '添加拍照提醒',
  mark_key_student: '标记重点学生',
  unmark_key_student: '取消重点标记',
  update_retest_list: '录入重测名单',
  update_quiz_completion: '更新小测状态',
  add_quiz_notes: '添加小测备注',
}

const CLASS_TYPE_LABELS: Record<string, string> = {
  GY: 'GY',
  KET: 'KET',
  PET: 'PET',
  FCE: 'FCE',
  CAE: 'CAE',
  CPE: 'CPE',
  OTHER: '其他',
}

const PAGE_LINKS: { label: string; href: string }[] = [
  { label: '仪表盘', href: '/dashboard' },
  { label: '我的工作流', href: '/workflow' },
  { label: '班级管理', href: '/classes' },
  { label: '知识库管理', href: '/knowledge-base' },
  { label: '公共知识库管理', href: '/admin/knowledge-base' },
  { label: '作业管理', href: '/homework' },
  { label: '随堂测验', href: '/quizzes' },
  { label: '反馈管理', href: '/feedback' },
  { label: '设置', href: '/settings' },
  { label: '个人信息', href: '/profile' },
  { label: '帮助与反馈', href: '/help' },
]

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}

function loadHistory(): ChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveHistory(messages: ChatMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  } catch {
  }
}

function removeHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
  }
}

function computeRemainingTime(classId: string): string | undefined {
  const now = new Date()
  const currentDay = now.getDay()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const schedules = getClassSchedules(classId)
  for (const s of schedules) {
    if (s.dayOfWeek === currentDay) {
      const [sH, sM] = s.startTime.split(':').map(Number)
      const [eH, eM] = s.endTime.split(':').map(Number)
      const start = sH * 60 + sM
      const end = eH * 60 + eM
      if (currentMinutes >= start && currentMinutes <= end) {
        const diff = end - currentMinutes
        if (diff <= 0) return '已结束'
        if (diff < 60) return `剩余 ${diff} 分钟`
        const hours = Math.floor(diff / 60)
        const mins = diff % 60
        return `剩余 ${hours} 小时${mins > 0 ? ` ${mins} 分钟` : ''}`
      }
      if (currentMinutes < start) {
        const diff = start - currentMinutes
        if (diff < 60) return `距离上课还有 ${diff} 分钟`
        const hours = Math.floor(diff / 60)
        const mins = diff % 60
        return `距离上课还有 ${hours} 小时${mins > 0 ? ` ${mins} 分钟` : ''}`
      }
    }
  }
  return undefined
}

function getTodayDateString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function collectClassData(classId: string) {
  const students = getStudentsByClass(classId)
  const todayStr = getTodayDateString()
  const todayQuizRecords = getQuizRecordsByClass(classId).filter(r => {
    const d = new Date(r.assessedAt).toISOString().split('T')[0]
    return d === todayStr
  })
  const todayHomeworkAssessments = getHomeworkAssessmentsByClass(classId).filter(a => {
    const d = new Date(a.assessedAt).toISOString().split('T')[0]
    return d === todayStr
  })
  const todayTasks = getCourseTasksByClassAndDate(classId, todayStr)
  const allFeedback = getFeedbackHistory()

  const studentIds = new Set(students.map(s => s.id))
  const todayFeedbackRecords = allFeedback.filter(r =>
    studentIds.has(r.studentId) && new Date(r.createdAt).toDateString() === new Date().toDateString()
  )

  const quizData = todayQuizRecords.map(r => {
    const student = students.find(s => s.id === r.studentId)
    return {
      studentName: student?.name || '未知学生',
      completion: r.completion,
      wordScore: r.wordScore,
      wordTotal: r.wordTotal,
      overallAccuracy: r.overallAccuracy,
    }
  })

  const hwData = todayHomeworkAssessments.map(a => {
    const student = students.find(s => s.id === a.studentId)
    return {
      studentName: student?.name || '未知学生',
      completion: a.completion,
      accuracy: a.accuracy,
      handwriting: a.handwriting,
      hasFeedback: !!a.feedback || !!a.generatedFeedback,
    }
  })

  const taskData = todayTasks.map(t => ({
    title: t.title,
    completed: t.completed,
    lesson: t.lesson,
  }))

  return {
    studentCount: students.length,
    students: students.map(s => ({ id: s.id, name: s.name })),
    quizRecords: quizData,
    homeworkAssessments: hwData,
    courseTasks: taskData,
    todayFeedbackCount: todayFeedbackRecords.length,
  }
}



export function FloatingChatAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeClass, setActiveClass] = useState<ReturnType<typeof getCurrentClassByTime>>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [agentSessionId, setAgentSessionId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatPanelRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<ChatMessage[]>([])
  const { refreshCourseProgress } = useProgress()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      const next = [...prev, msg]
      if (next.length > 100) {
        return next.slice(-100)
      }
      return next
    })
  }, [])

  const handleNavigate = useCallback((label: string, href: string) => {
    try {
      router.push(href)
      const classContext = activeClass
        ? `，当前班级：${activeClass.name}（${activeClass.type}）`
        : ''
      addMessage({
        id: generateId(),
        role: 'assistant',
        content: `✅ 已为你打开【${label}】页面${classContext}`,
        timestamp: Date.now(),
        type: 'text',
      })
    } catch {
      addMessage({
        id: generateId(),
        role: 'assistant',
        content: '❌ 打开失败，请检查网络或手动访问',
        timestamp: Date.now(),
        type: 'text',
      })
    }
  }, [router, activeClass, addMessage])

  const handleToggleTheme = useCallback((targetMode?: 'dark' | 'light') => {
    try {
      const resolvedMode = targetMode || (theme === 'dark' ? 'light' : 'dark')
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('dark', 'light')
        document.documentElement.classList.add(resolvedMode)
        localStorage.setItem('theme', resolvedMode)
      }
      setTheme(resolvedMode)
      addMessage({
        id: generateId(),
        role: 'assistant',
        content: `✅ 已为你切换至【${resolvedMode === 'dark' ? '深色模式' : '浅色模式'}】`,
        timestamp: Date.now(),
        type: 'text',
      })
    } catch {
      addMessage({
        id: generateId(),
        role: 'assistant',
        content: '❌ 切换失败，请稍后重试',
        timestamp: Date.now(),
        type: 'text',
      })
    }
  }, [theme, setTheme, addMessage])

  const scrollToBottom = useCallback((smooth = true) => {
    const container = chatContainerRef.current
    if (!container) return
    if (smooth) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
    } else {
      container.scrollTop = container.scrollHeight
    }
  }, [])

  const syncActiveClass = useCallback(() => {
    const detected = getCurrentClassByTime()
    setActiveClass(detected)
    if (detected) {
      refreshCourseProgress(detected.id)
    }
  }, [refreshCourseProgress])

  useEffect(() => {
    setMessages(loadHistory())
    syncActiveClass()
    loadPublicKnowledgeBase()
  }, [syncActiveClass])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    if (messages.length > 0) {
      saveHistory(messages)
    }
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
        scrollToBottom(false)
      }, 150)
    }
  }, [isOpen, scrollToBottom])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  useEffect(() => {
    const interval = setInterval(syncActiveClass, 30000)
    const handleDataChange = () => syncActiveClass()
    window.addEventListener('classDataChanged', handleDataChange)
    return () => {
      clearInterval(interval)
      window.removeEventListener('classDataChanged', handleDataChange)
    }
  }, [syncActiveClass])

  const buildClassContext = useCallback(() => {
    const cls = getCurrentClassByTime()
    if (!cls) return undefined

    const classId = cls.id
    const displayType = cls.type
    const todayDateStr = getTodayDateString()
    const todayTasks = getCourseTasksByClassAndDate(classId, todayDateStr)
    const completedCount = todayTasks.filter(t => t.completed).length
    const totalCount = todayTasks.length
    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    const schedules = getClassSchedules(classId)
    const isInClass = schedules.some((s) => {
      const now = new Date()
      const day = now.getDay()
      const minutes = now.getHours() * 60 + now.getMinutes()
      const [sH, sM] = s.startTime.split(':').map(Number)
      const [eH, eM] = s.endTime.split(':').map(Number)
      return s.dayOfWeek === day && minutes >= sH * 60 + sM && minutes <= eH * 60 + eM
    })
    const remainingTime = computeRemainingTime(classId)
    const lessonLabel = totalCount > 0
      ? `第${completedCount + 1}/${totalCount}项任务`
      : undefined
    const workflowStats = getWorkflowTodoStats(classId)
    const currentTask = isInClass
      ? (totalCount > 0
          ? `第${completedCount + 1}/${totalCount}个任务（已完成${completedCount}个）`
          : '课中')
      : (totalCount > 0
          ? `已完成${completedCount}/${totalCount}个任务`
          : undefined)
    const classData = collectClassData(classId)

    return {
      courseName: cls.name,
      classType: displayType,
      currentTask,
      remainingTime: remainingTime || (totalCount > 0 ? `${progressPct}% 完成` : undefined),
      lessonLabel,
      workflowCompleted: workflowStats.completed,
      workflowTotal: workflowStats.total,
      classData,
    }
  }, [])

  const handleAgentResponse = useCallback((text: string) => {
    const agentResult = processAgentInput(text)

    if (agentResult.sessionId) {
      setAgentSessionId(agentResult.sessionId)
    }

    if (!agentResult.isAgentMode) {
      setAgentSessionId(null)
    }

    if (agentResult.cardData) {
      addMessage({
        id: generateId(),
        role: 'assistant',
        content: agentResult.message,
        timestamp: Date.now(),
        type: 'text',
        cardData: agentResult.cardData,
      })
    } else {
      let replyContent = agentResult.message

      if (agentResult.success && agentResult.syncTo) {
        replyContent = agentResult.message
      }

      if (agentResult.needMoreInfo && agentResult.followUpQuestion) {
        replyContent += `\n\n${agentResult.followUpQuestion}`
      }

      if (agentResult.isAgentMode && !agentResult.cardData) {
        setAgentSessionId(null)
      }

      addMessage({
        id: generateId(),
        role: 'assistant',
        content: replyContent,
        timestamp: Date.now(),
        type: 'text',
      })
    }
  }, [addMessage])

  const handleApiChat = useCallback(async (text: string) => {
    const classContext = buildClassContext()

    const history = messagesRef.current
      .slice(-10)
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }))

    const result = await httpClient.post<ChatApiResponse>('/ta-assistant/chat', {
      message: text,
      ...(classContext || {}),
      history: history.length > 0 ? history : undefined,
    })

    if (result.source === 'knowledge_base') {
      const entry = result.entry
      const contentText = entry.url
        ? `${entry.content}\n\n${entry.url}`
        : entry.content

      addMessage({
        id: generateId(),
        role: 'assistant',
        content: contentText,
        timestamp: Date.now(),
        url: entry.url,
        type: 'knowledge',
      })
    } else {
      addMessage({
        id: generateId(),
        role: 'assistant',
        content: result.reply,
        timestamp: Date.now(),
        type: 'text',
      })
    }
  }, [buildClassContext, addMessage])

  const handleLocalChat = useCallback(async (text: string) => {
    const trimmed = text.trim()

    const knowledgeResults = matchKnowledgeBase(trimmed)
    if (knowledgeResults.length > 0) {
      const match = knowledgeResults[0]
      const contentText = match.url
        ? `${match.content}\n\n${match.url}`
        : match.content
      addMessage({
        id: generateId(),
        role: 'assistant',
        content: contentText,
        timestamp: Date.now(),
        url: match.url,
        type: 'knowledge',
      })
      return
    }

    const greetingMatch = trimmed.match(/^(?:hi|hello|你好|您好|嗨|早上好|下午好|晚上好|大家好|hey)\b/i)
    if (greetingMatch) {
      const cls = getCurrentClassByTime()
      if (cls) {
        addMessage({
          id: generateId(),
          role: 'assistant',
          content: `你好！我是英语助教小T 👋\n你当前活跃班级是「${cls.name}（${cls.type}）」哦~\n可以向我提问或下达操作指令，比如「创建新班级」「标记张三为重点关注」「录入重测名单」等。`,
          timestamp: Date.now(),
          type: 'text',
        })
      } else {
        addMessage({
          id: generateId(),
          role: 'assistant',
          content: `你好！我是英语助教小T 👋\n当前暂未检测到上课班级，你可以：\n1. 问我通用教学问题\n2. 下达操作指令（如「创建新班级」「标记重点学生」）`,
          timestamp: Date.now(),
          type: 'text',
        })
      }
      return
    }

    addMessage({
      id: generateId(),
      role: 'assistant',
      content: `抱歉，我现在无法连接到远程AI服务。您可以尝试以下操作指令：\n\n📋 班级管理：「创建新班级」「设置高一1班类型为GY」\n👨‍🎓 学生管理：「标记张三为重点关注」「取消李四的重点标记」\n📝 工作流管理：「添加新任务：课堂小测」「调整任务顺序」\n📊 小测管理：「录入重测名单」「更新小测状态」`,
      timestamp: Date.now(),
      type: 'text',
    })
  }, [addMessage])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    }
    addMessage(userMsg)
    setInputValue('')
    setIsLoading(true)

    const navMatch = trimmed.match(/^(?:打开|前往|跳转到?|进入)\s*(.+?)(?:\s*页面)?$/)
    if (navMatch) {
      let target = navMatch[1].trim()
      const aliasMap: Record<string, string> = { '知识库': '知识库管理', '公共知识库': '公共知识库管理' }
      target = aliasMap[target] || target
      const page = PAGE_LINKS.find((p) => p.label === target)
      if (page) {
        handleNavigate(page.label, page.href)
        setIsLoading(false)
        return
      }
    }

    const themeMatch = trimmed.match(/^(?:切换|设置|开启|关闭)\s*(深色模式|浅色模式|暗色模式|亮色模式|夜间模式|日间模式|主题|模式)/)
    if (themeMatch) {
      const modeLabel = themeMatch[1]
      const darkLabels = ['深色模式', '暗色模式', '夜间模式']
      const lightLabels = ['浅色模式', '亮色模式', '日间模式']
      const targetMode = darkLabels.includes(modeLabel) ? 'dark' : lightLabels.includes(modeLabel) ? 'light' : undefined
      handleToggleTheme(targetMode as 'dark' | 'light' | undefined)
      setIsLoading(false)
      return
    }

    try {
      if (agentSessionId || isOperationIntent(trimmed)) {
        handleAgentResponse(trimmed)
      } else {
        try {
          await handleApiChat(trimmed)
        } catch {
          await handleLocalChat(trimmed)
        }
      }
    } catch {
      addMessage({
        id: generateId(),
        role: 'assistant',
        content: '抱歉，我现在暂时无法处理你的请求，请稍后再试。',
        timestamp: Date.now(),
      })
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, agentSessionId, buildClassContext, addMessage, handleAgentResponse, handleApiChat, handleLocalChat, handleToggleTheme])

  const handleAgentCancel = useCallback(() => {
    sendMessage('取消')
  }, [sendMessage])

  const handleQuickSelect = useCallback((value: string) => {
    sendMessage(value)
  }, [sendMessage])

  const handleSend = useCallback(() => {
    sendMessage(inputValue)
  }, [inputValue, sendMessage])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const handleQuickQuestion = useCallback((question: string) => {
    sendMessage(question)
  }, [sendMessage])

  const handleClear = useCallback(() => {
    setShowClearConfirm(false)
    setAgentSessionId(null)
    setMessages([])
    messagesRef.current = []
    removeHistory()
    const resetMsg: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: '对话已清空，我们重新开始吧😊',
      timestamp: Date.now(),
      type: 'text',
    }
    setMessages([resetMsg])
    messagesRef.current = [resetMsg]
  }, [])

  const formatTime = (ts: number): string => {
    const date = new Date(ts)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    if (isToday) {
      return `${hours}:${minutes}`
    }
    return `${date.getMonth() + 1}/${date.getDate()} ${hours}:${minutes}`
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100]" style={{ isolation: 'isolate' }}>
      {isOpen && (
        <div
          ref={chatPanelRef}
          className={cn(
            'absolute bottom-16 right-0',
            'w-[380px] max-w-[calc(100vw-48px)]',
            'h-[560px] max-h-[calc(100vh-180px)]',
            'flex flex-col',
            'rounded-2xl border border-border',
            'bg-card text-card-foreground',
            'shadow-2xl shadow-black/10 dark:shadow-black/30',
            'animate-scale-in origin-bottom-right',
            'overflow-hidden',
            'relative'
          )}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground leading-tight">英语助教助手</h3>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  小T · 智能助理
                  {activeClass && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium">
                      {activeClass.name}（{activeClass.type}）
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowClearConfirm(true)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
                aria-label="清空对话"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
                aria-label="关闭对话"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {agentSessionId && (
            <div className="px-4 py-2 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/10 shrink-0">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-medium text-primary">Agent操作模式已开启</span>
                <span className="text-muted-foreground">· 我将引导你完成操作并同步到对应板块</span>
              </div>
            </div>
          )}

          <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
            {messages.length === 0 && (
              <div className="flex flex-col items-center h-full text-center px-4 py-4 overflow-y-auto scrollbar-thin">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 shrink-0">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <div className="text-[11px] text-muted-foreground leading-relaxed space-y-1 shrink-0">
                  <p className="font-medium text-foreground">你好！我是英语助教小T 👋</p>
                  {activeClass ? (
                    <p>
                      你当前活跃班级是{activeClass.name}（{activeClass.type}）哦~
                    </p>
                  ) : (
                    <p>当前暂未检测到上课班级，你可以向我询问通用教学问题。</p>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap justify-center gap-1.5 shrink-0">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q.label}
                      onClick={() => handleQuickQuestion(q.label)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-lg border border-border bg-accent/30 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {q.icon && <q.icon className="w-3 h-3" />}
                      {q.label}
                    </button>
                  ))}
                </div>
                <div className="mt-4 w-full shrink-0">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="h-px flex-1 bg-border/50" />
                    <span className="text-[10px] font-medium text-muted-foreground px-1 flex items-center gap-1">
                      <Navigation className="w-3 h-3" />
                      全功能快捷操作
                    </span>
                    <div className="h-px flex-1 bg-border/50" />
                  </div>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {PAGE_LINKS.map((page) => (
                      <button
                        key={page.label}
                        onClick={() => handleNavigate(page.label, page.href)}
                        className="px-2.5 py-1 text-[11px] rounded-lg border border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {page.label}
                      </button>
                    ))}
                    <button
                      onClick={() => handleToggleTheme()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg border border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {theme === 'dark' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                      {theme === 'dark' ? '浅色模式' : '深色模式'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'user' ? (
                  <div className="max-w-[85%] rounded-2xl px-4 py-2.5 bg-primary text-primary-foreground rounded-br-lg relative group">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                    <span className="block text-[10px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-primary-foreground/60 text-right">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                ) : msg.cardData ? (
                  <div className="max-w-[95%] space-y-2">
                    <div className="bg-accent/50 border border-border/50 rounded-2xl rounded-bl-lg px-4 py-2.5">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                      <span className="block text-[10px] mt-1 text-muted-foreground">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    <AgentStepCard
                      cardData={msg.cardData}
                      onCancel={handleAgentCancel}
                      onQuickSelect={handleQuickSelect}
                    />
                  </div>
                ) : (
                  <div className="max-w-[85%] rounded-2xl rounded-bl-lg px-4 py-2.5 bg-accent/50 border border-border/50 relative group">
                    {msg.type === 'knowledge' && msg.url && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                          知识库
                        </span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                    {msg.type === 'knowledge' && msg.url && (
                      <a
                        href={msg.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        打开链接
                      </a>
                    )}
                    <span className="block text-[10px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-lg px-4 py-3 bg-accent/50 border border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce-subtle" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce-subtle" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce-subtle" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-muted-foreground">正在思考...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length > 3 && !agentSessionId && (
            <div className="px-4 pb-1 space-y-1.5">
              <div className="flex flex-wrap gap-1.5">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => handleQuickQuestion(q.label)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg border border-border bg-accent/20 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {q.icon && <q.icon className="w-3 h-3" />}
                    {q.label}
                  </button>
                ))}
              </div>
              <details className="group">
                <summary className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none">
                  <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" />
                  全功能快捷操作
                </summary>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {PAGE_LINKS.map((page) => (
                    <button
                      key={page.label}
                      onClick={() => handleNavigate(page.label, page.href)}
                      className="px-2 py-1 text-[10px] rounded-lg border border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {page.label}
                    </button>
                  ))}
                  <button
                    onClick={() => handleToggleTheme()}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded-lg border border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {theme === 'dark' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                    {theme === 'dark' ? '浅色模式' : '深色模式'}
                  </button>
                </div>
              </details>
            </div>
          )}

          {showClearConfirm && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="bg-card border border-border rounded-xl shadow-xl p-5 mx-4 w-[280px]">
                <p className="text-sm text-center text-foreground mb-4">
                  确定要清空本次对话记录吗？清空后无法恢复
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-4 py-2 text-sm rounded-lg border border-border bg-accent/30 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleClear}
                    className="px-4 py-2 text-sm rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                  >
                    确认清空
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="shrink-0 border-t border-border px-4 py-3 bg-card/80">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={agentSessionId ? '请根据卡片提示输入信息...' : '输入你的问题...'}
                  disabled={isLoading}
                  className={cn(
                    'w-full h-10 pl-4 pr-10 text-sm rounded-xl',
                    'border border-input bg-background',
                    'placeholder:text-muted-foreground/50',
                    'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-all'
                  )}
                />
                {agentSessionId && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  </div>
                )}
              </div>
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                  'bg-primary text-primary-foreground',
                  'hover:bg-primary/90 active:scale-95',
                  'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
                  'transition-all'
                )}
                aria-label="发送消息"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'w-14 h-14 rounded-2xl flex items-center justify-center',
          'bg-gradient-to-br from-primary to-secondary',
          'text-primary-foreground shadow-lg shadow-primary/25',
          'hover:shadow-xl hover:shadow-primary/30 hover:scale-105',
          'active:scale-95 transition-all duration-200',
          'relative'
        )}
        aria-label={isOpen ? '关闭助教' : '打开助教'}
      >
        {isOpen ? (
          <ChevronDown className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>
    </div>
  )
}
