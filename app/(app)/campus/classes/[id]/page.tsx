'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, GraduationCap, Users, BookOpen, Loader2, RefreshCw,
  ClipboardCheck, MessageSquareText, Target, TrendingUp, TrendingDown,
  Minus, Clock, Calendar, ChevronDown, ChevronUp, Search, Filter,
} from 'lucide-react'
import { useRoleAccess } from '@/lib/use-role-access'
import { useAuth } from '@/lib/auth-store'
import { PageContainer } from '@/components/ui/page-container'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface ClassInfo {
  id: string
  name: string
  type: string
  studentCount: number
  color: string
  createdAt: string
  description: string
  classAdmin: { id: string; displayName: string; username: string }
}

interface Student {
  id: string
  name: string
  notes: string
  createdAt: string
}

interface Schedule {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

interface QuizRecordItem {
  id: string
  studentName: string
  courseName: string
  score: string
  accuracy: number | null
  date: string
  type: string
  notes: string
  createdAt: string
}

interface FeedbackRecordItem {
  id: string
  studentName: string
  courseName: string
  content: string
  date: string
  type: string
  createdAt: string
}

interface ClassDetailData {
  class: ClassInfo
  students: Student[]
  schedules: Schedule[]
  quizRecords: QuizRecordItem[]
  quizStats: {
    totalRecords: number
    avgAccuracy: number | null
    highestAccuracy: number | null
    lowestAccuracy: number | null
  }
  feedbackRecords: FeedbackRecordItem[]
  feedbackStats: {
    totalRecords: number
  }
}

const DAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function getAccuracyColor(accuracy: number | null): string {
  if (accuracy === null) return 'text-gray-400'
  if (accuracy >= 85) return 'text-green-500'
  if (accuracy >= 60) return 'text-amber-500'
  return 'text-red-500'
}

function getAccuracyBg(accuracy: number | null): string {
  if (accuracy === null) return 'bg-gray-100 dark:bg-gray-800'
  if (accuracy >= 85) return 'bg-green-100 dark:bg-green-900/30'
  if (accuracy >= 60) return 'bg-amber-100 dark:bg-amber-900/30'
  return 'bg-red-100 dark:bg-red-900/30'
}

export default function CampusClassDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isCampusAdmin } = useRoleAccess()
  const { getToken } = useAuth()
  const [data, setData] = useState<ClassDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'quiz' | 'feedback'>('overview')
  const [quizSearch, setQuizSearch] = useState('')
  const [feedbackSearch, setFeedbackSearch] = useState('')
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null)
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null)

  const authHeaders: Record<string, string> = {
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  }

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/campus/class/${params.id}`, { headers: authHeaders })
      const result = await res.json()
      if (!res.ok) {
        setError(result.error || '获取数据失败')
        return
      }
      setData(result.data)
    } catch {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isCampusAdmin && params.id) fetchData()
  }, [isCampusAdmin, params.id])

  if (!isCampusAdmin) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64 text-muted-foreground">无权访问此页面</div>
      </PageContainer>
    )
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    )
  }

  if (error || !data) {
    return (
      <PageContainer>
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />返回
          </button>
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="text-destructive">{error || '数据加载失败'}</p>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />重试
            </button>
          </div>
        </div>
      </PageContainer>
    )
  }

  const filteredQuizRecords = data.quizRecords.filter(r =>
    r.studentName.toLowerCase().includes(quizSearch.toLowerCase()) ||
    r.courseName.toLowerCase().includes(quizSearch.toLowerCase())
  )

  const filteredFeedbackRecords = data.feedbackRecords.filter(r =>
    r.studentName.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
    r.courseName.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
    r.content.toLowerCase().includes(feedbackSearch.toLowerCase())
  )

  const tabs = [
    { key: 'overview' as const, label: '班级概览', icon: BookOpen },
    { key: 'students' as const, label: '班级学生', icon: Users },
    { key: 'quiz' as const, label: '小测记录', icon: ClipboardCheck },
    { key: 'feedback' as const, label: '课上反馈', icon: MessageSquareText },
  ]

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-xl border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{data.class.name}</h1>
                {data.class.type && (
                  <span className="px-2.5 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium">
                    {data.class.type}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                管理员: {data.class.classAdmin.displayName || data.class.classAdmin.username}
                {' · '}{data.students.length} 名学生
                {data.schedules.length > 0 && ` · ${data.schedules.length} 个上课时间`}
              </p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <RefreshCw className="w-4 h-4" />刷新
          </button>
        </div>

        <div className="flex gap-1 p-1 rounded-2xl bg-muted/50 border border-border">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 flex-1 justify-center',
                activeTab === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl border border-border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{data.students.length}</p>
                      <p className="text-xs text-muted-foreground">班级学生</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 rounded-2xl border border-border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <ClipboardCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{data.quizStats.totalRecords}</p>
                      <p className="text-xs text-muted-foreground">小测记录</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 rounded-2xl border border-border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className={cn(
                        'text-2xl font-bold',
                        data.quizStats.avgAccuracy !== null ? getAccuracyColor(data.quizStats.avgAccuracy) : 'text-muted-foreground'
                      )}>
                        {data.quizStats.avgAccuracy !== null ? `${data.quizStats.avgAccuracy}%` : '-'}
                      </p>
                      <p className="text-xs text-muted-foreground">平均正确率</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 rounded-2xl border border-border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <MessageSquareText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{data.feedbackStats.totalRecords}</p>
                      <p className="text-xs text-muted-foreground">课上反馈</p>
                    </div>
                  </div>
                </div>
              </div>

              {data.quizStats.totalRecords > 0 && (
                <div className="p-6 rounded-2xl border border-border bg-card">
                  <h3 className="font-semibold text-foreground mb-4">小测正确率分析</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-xs text-muted-foreground">最高正确率</span>
                      </div>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
                        {data.quizStats.highestAccuracy !== null ? `${data.quizStats.highestAccuracy}%` : '-'}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30">
                      <div className="flex items-center gap-2">
                        <Minus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs text-muted-foreground">平均正确率</span>
                      </div>
                      <p className={cn('text-xl font-bold mt-1', getAccuracyColor(data.quizStats.avgAccuracy))}>
                        {data.quizStats.avgAccuracy !== null ? `${data.quizStats.avgAccuracy}%` : '-'}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span className="text-xs text-muted-foreground">最低正确率</span>
                      </div>
                      <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">
                        {data.quizStats.lowestAccuracy !== null ? `${data.quizStats.lowestAccuracy}%` : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-6 rounded-2xl border border-border bg-card">
                <h3 className="font-semibold text-foreground mb-4">上课时间</h3>
                {data.schedules.length === 0 ? (
                  <p className="text-sm text-muted-foreground">暂未设置上课时间</p>
                ) : (
                  <div className="space-y-2">
                    {data.schedules.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map(s => (
                      <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">{DAY_LABELS[s.dayOfWeek]}</span>
                        <span className="text-sm text-muted-foreground">
                          {s.startTime} - {s.endTime}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'students' && (
            <motion.div
              key="students"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={quizSearch}
                    onChange={(e) => setQuizSearch(e.target.value)}
                    placeholder="搜索学生姓名..."
                    className="w-full h-10 pl-10 pr-4 text-sm rounded-xl border border-input bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <span className="text-sm text-muted-foreground">{data.students.length} 名学生</span>
              </div>
              {data.students.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground">暂无学生数据</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.students.map((student, index) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="p-4 rounded-2xl border border-border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-sm font-semibold text-primary">
                          {student.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{student.name}</p>
                        </div>
                      </div>
                      {student.notes && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-xs text-muted-foreground">📝 {student.notes}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={quizSearch}
                    onChange={(e) => setQuizSearch(e.target.value)}
                    placeholder="搜索学生或课程..."
                    className="w-full h-10 pl-10 pr-4 text-sm rounded-xl border border-input bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <span className="text-sm text-muted-foreground">{filteredQuizRecords.length} 条记录</span>
              </div>
              {data.quizStats.avgAccuracy !== null && (
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border border-emerald-200 dark:border-emerald-900/30">
                  <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm text-foreground">
                    班级小测平均正确率：
                    <span className={cn('font-bold text-lg ml-1', getAccuracyColor(data.quizStats.avgAccuracy))}>
                      {data.quizStats.avgAccuracy}%
                    </span>
                  </span>
                </div>
              )}
              {filteredQuizRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <ClipboardCheck className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground">暂无小测记录</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredQuizRecords.map((record, index) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="p-4 rounded-2xl border border-border bg-card"
                    >
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setExpandedQuiz(expandedQuiz === record.id ? null : record.id)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                            {record.studentName.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{record.studentName}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {record.courseName || '通用'} · {record.date || '未注明日期'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className={cn(
                            'px-2.5 py-1 rounded-lg text-xs font-bold',
                            getAccuracyBg(record.accuracy),
                            getAccuracyColor(record.accuracy),
                          )}>
                            {record.accuracy !== null ? `${record.accuracy}%` : record.score || '-'}
                          </div>
                          {expandedQuiz === record.id ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <AnimatePresence>
                        {expandedQuiz === record.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 pt-3 border-t border-border space-y-2">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-2.5 rounded-lg bg-muted/30">
                                  <p className="text-xs text-muted-foreground">成绩</p>
                                  <p className="text-sm font-medium text-foreground">{record.score || '-'}</p>
                                </div>
                                <div className="p-2.5 rounded-lg bg-muted/30">
                                  <p className="text-xs text-muted-foreground">正确率</p>
                                  <p className={cn('text-sm font-medium', getAccuracyColor(record.accuracy))}>
                                    {record.accuracy !== null ? `${record.accuracy}%` : '-'}
                                  </p>
                                </div>
                              </div>
                              {record.notes && (
                                <div className="p-2.5 rounded-lg bg-muted/30">
                                  <p className="text-xs text-muted-foreground">备注</p>
                                  <p className="text-sm text-foreground mt-0.5">{record.notes}</p>
                                </div>
                              )}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />{record.date || '未注明日期'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />{new Date(record.createdAt).toLocaleDateString('zh-CN')}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'feedback' && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={feedbackSearch}
                    onChange={(e) => setFeedbackSearch(e.target.value)}
                    placeholder="搜索学生、课程或内容..."
                    className="w-full h-10 pl-10 pr-4 text-sm rounded-xl border border-input bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <span className="text-sm text-muted-foreground">{filteredFeedbackRecords.length} 条记录</span>
              </div>
              {filteredFeedbackRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageSquareText className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground">暂无课上反馈记录</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFeedbackRecords.map((record, index) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="p-4 rounded-2xl border border-border bg-card"
                    >
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setExpandedFeedback(expandedFeedback === record.id ? null : record.id)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center text-xs font-semibold text-amber-600 dark:text-amber-400 shrink-0">
                            {record.studentName.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{record.studentName}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {record.courseName || '通用'} · {record.date || '未注明日期'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {record.type && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium">
                              {record.type}
                            </span>
                          )}
                          {expandedFeedback === record.id ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <AnimatePresence>
                        {expandedFeedback === record.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 pt-3 border-t border-border space-y-2">
                              <div className="p-3 rounded-xl bg-muted/30">
                                <p className="text-xs text-muted-foreground mb-1">反馈内容</p>
                                <p className="text-sm text-foreground whitespace-pre-wrap">{record.content}</p>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />{record.date || '未注明日期'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />{new Date(record.createdAt).toLocaleDateString('zh-CN')}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageContainer>
  )
}
