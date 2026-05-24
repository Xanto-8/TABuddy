'use client'

import React, { useState, useEffect } from 'react'
import { Brain, RefreshCw, AlertCircle, Loader2 } from 'lucide-react'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-store'
import type { PortfolioData } from '@/lib/portfolio-aggregator'

interface AIReportCardProps {
  portfolio: PortfolioData
}

export function AIReportCard({ portfolio }: AIReportCardProps) {
  const { getToken } = useAuth()
  const [report, setReport] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<string>('')

  const storageKey = `portfolio_report_${portfolio.className}_${portfolio.studentName}`

  const fetchReport = async (force = false) => {
    if (!force) {
      try {
        const cached = sessionStorage.getItem(storageKey)
        if (cached) {
          setReport(cached)
          return
        }
      } catch {}
    }

    if (portfolio.stats.quizCount < 1) {
      setError('数据不足，至少需要1次小测记录才能生成分析报告')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const token = getToken()
      if (!token) {
        setError('请重新登录')
        return
      }

      const res = await fetch('/api/portfolio/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentName: portfolio.studentName,
          className: portfolio.className,
          classType: portfolio.classType,
          quizSummary: portfolio.quizSummary,
          homeworkSummary: portfolio.homeworkSummary,
          allFeedbackContents: portfolio.allFeedbackContents,
          observationContents: portfolio.observationContents,
          absenceCount: portfolio.stats.absenceCount,
          totalLessons: portfolio.stats.totalLessons,
        }),
      })

      const data = await res.json()
      if (data.report) {
        setReport(data.report)
        setSource(data.source || '')
        if (data.source === 'ai') {
          try { sessionStorage.setItem(storageKey, data.report) } catch {}
        }
      } else if (data.error) {
        setError(data.error)
      } else {
        setError('生成失败，请稍后重试')
      }
    } catch {
      setError('网络错误，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [portfolio.studentName])

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-8">
        <div className="flex items-center gap-3 text-primary">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-base font-semibold">AI 正在分析学习数据，生成专业报告...</span>
        </div>
        <div className="mt-4 space-y-3 animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-5/6" />
          <div className="h-3 bg-muted rounded w-1/3 mt-6" />
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-card rounded-xl border border-border p-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-primary" />
              AI 学习分析报告
            </h2>
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={() => fetchReport(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              重新生成
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!report) return null

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          AI 学习分析报告
          {source === 'fallback' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              基础分析
            </span>
          )}
        </h2>
        <button
          onClick={() => fetchReport(true)}
          disabled={loading}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            'bg-accent text-muted-foreground hover:text-foreground hover:bg-accent/80',
          )}
        >
          <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
          重新生成
        </button>
      </div>
      <MarkdownRenderer content={report} />
    </div>
  )
}
