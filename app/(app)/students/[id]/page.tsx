'use client'

import React, { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, TrendingUp, FileText, ClipboardCheck,
  Download, Star, User, Loader2, Calendar, Brain,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { PageContainer } from '@/components/ui/page-container'
import { getStudentsByClass, getClasses, getFeedbackHistoryByStudent } from '@/lib/store'
import { cn } from '@/lib/utils'
import { aggregateStudentPortfolio } from '@/lib/portfolio-aggregator'
import { AIReportCard } from '@/components/portfolio/AIReportCard'
import { QuizDetailTable } from '@/components/portfolio/QuizDetailTable'
import { AttendanceCard } from '@/components/portfolio/AttendanceCard'
import type { Student } from '@/types'
import type { PortfolioData } from '@/lib/portfolio-aggregator'

const GrowthChart = dynamic(() => import('./_growth-chart'), {
  loading: () => <div className="h-72 bg-card border border-border rounded-xl animate-pulse" />,
})

function getLocalDateStr(d?: string | Date): string {
  if (!d) return ''
  const date = new Date(d)
  if (isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getLocalTime(d?: string | Date): string {
  if (!d) return ''
  const date = new Date(d)
  if (isNaN(date.getTime())) return ''
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export default function StudentPortfolioPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.id as string
  const [pdfGenerating, setPdfGenerating] = useState(false)

  const portfolio = useMemo<PortfolioData | null>(() => {
    if (!studentId) return null
    return aggregateStudentPortfolio(studentId)
  }, [studentId])

  const { student, className } = useMemo(() => {
    const classes = getClasses()
    for (const cls of classes) {
      const students = getStudentsByClass(cls.id)
      const found = students.find(s => s.id === studentId)
      if (found) return { student: found, className: cls.name }
    }
    return { student: undefined as Student | undefined, className: '' }
  }, [studentId])

  const feedbackHistory = useMemo(() => {
    if (!studentId) return []
    return [...getFeedbackHistoryByStudent(studentId)].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [studentId])

  const absenceDates = useMemo(() => {
    if (!portfolio) return []
    return portfolio.quizDetails
      .filter(q => q.isAbsent)
      .map(q => q.date)
      .filter(Boolean)
  }, [portfolio])

  const accuracyChartData = useMemo(() => {
    const homeworkAssessments = portfolio?.homeworkSummary
    const quizDetails = portfolio?.quizDetails
    if (!quizDetails) return []

    const map = new Map<string, { date: string; homework?: number; quiz?: number }>()
    for (const q of quizDetails.filter(r => !r.isAbsent)) {
      const d = q.date
      if (!d || map.has(d)) continue
      const entry = map.get(d) || { date: d }
      if (q.wordAccuracy != null) entry.quiz = q.wordAccuracy
      if (q.overallAccuracy != null && entry.quiz == null) entry.quiz = q.overallAccuracy
      map.set(d, entry)
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date)).slice(-30)
  }, [portfolio])

  const handleExportPDF = async () => {
    setPdfGenerating(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: html2canvas } = await import('html2canvas')

      const el = document.getElementById('portfolio-content')
      if (!el) throw new Error('未找到页面内容')

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      const imgData = canvas.toDataURL('image/png')

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const imgHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.setFontSize(18)
      pdf.text(`${student?.name ?? ''} 学期学习分析报告`, 14, 15)
      pdf.setFontSize(10)
      pdf.text(
        `班级：${className} | 课程：${portfolio?.classType ?? ''} | 生成日期：${getLocalDateStr(new Date())}`,
        14, 24,
      )

      let heightLeft = imgHeight
      let position = 30

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight)
      heightLeft -= pdf.internal.pageSize.getHeight() - position

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 30
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight)
        heightLeft -= pdf.internal.pageSize.getHeight()
      }

      pdf.save(`${student?.name ?? '学生'}_学习分析报告.pdf`)
      toast.success('PDF 报告已导出')
    } catch (err: any) {
      toast.error('PDF 导出失败：' + (err.message || '未知错误'))
    } finally {
      setPdfGenerating(false)
    }
  }

  if (!student || !portfolio) {
    return (
      <PageContainer>
        <div className="text-center py-20">
          <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">未找到该学生</p>
          <button
            onClick={() => router.push('/students')}
            className="mt-4 text-sm text-primary hover:underline"
          >
            返回学生列表
          </button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="space-y-6 max-w-5xl" id="portfolio-content">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-4">
              {student.avatar ? (
                <img src={student.avatar} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-border" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {student.name[0]}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-foreground">{student.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {className}
                  {portfolio.classType && portfolio.classType !== 'OTHER' && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {portfolio.classType}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleExportPDF}
            disabled={pdfGenerating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50 shadow-sm"
          >
            {pdfGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            导出 PDF 报告
          </button>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: '作业评估', value: portfolio.stats.homeworkCount, sub: '次', icon: FileText, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
            { label: '小测记录', value: portfolio.stats.quizCount, sub: '次', icon: ClipboardCheck, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
            { label: '缺勤', value: portfolio.stats.absenceCount, sub: '次', icon: TrendingUp, color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
            { label: '平均正确率', value: portfolio.stats.avgQuizWordAccuracy, sub: '%', icon: TrendingUp, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className={cn('p-2.5 rounded-lg', item.color)}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-baseline gap-0.5">
                    <p className="text-2xl font-bold text-foreground">{item.value}</p>
                    <span className="text-sm text-muted-foreground">{item.sub}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GrowthChart data={accuracyChartData} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <QuizDetailTable data={portfolio.quizDetails} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <AttendanceCard
            totalLessons={portfolio.stats.totalLessons}
            absenceCount={portfolio.stats.absenceCount}
            absenceDates={absenceDates}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <AIReportCard portfolio={portfolio} />
        </motion.div>

        {feedbackHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-card rounded-xl border border-border p-6"
          >
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
              <Star className="h-4 w-4 text-amber-500" />
              近期课堂反馈
              <span className="text-xs font-normal text-muted-foreground ml-2">（共{feedbackHistory.length}条）</span>
            </h2>
            <div className="grid gap-3">
              {feedbackHistory.slice(0, 5).map((f, i) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.05 }}
                  className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-border transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{getLocalDateStr(f.createdAt)}</span>
                    {f.overallGrade && (
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                        f.overallGrade === '优秀' || f.overallGrade === 'A' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        f.overallGrade === '良好' || f.overallGrade === 'B' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-muted text-muted-foreground',
                      )}>
                        {f.overallGrade}
                      </span>
                    )}
                    {f.totalRate != null && (
                      <span className="text-[10px] text-muted-foreground">
                        {(f.totalRate * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{f.generatedContent}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="text-center py-8">
          <p className="text-xs text-muted-foreground">
            本报告由 TABuddy AI 教学助手生成 · {getLocalDateStr(new Date())}
          </p>
        </div>
      </div>
    </PageContainer>
  )
}
