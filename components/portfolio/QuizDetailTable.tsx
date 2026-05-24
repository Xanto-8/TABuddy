'use client'

import React from 'react'
import { AlertTriangle, Check, X, Minus, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PortfolioQuizDetail } from '@/lib/portfolio-aggregator'

interface QuizDetailTableProps {
  data: PortfolioQuizDetail[]
}

const completionIcons: Record<string, React.ReactNode> = {
  completed: <Check className="h-4 w-4 text-green-500" />,
  partial: <Minus className="h-4 w-4 text-orange-500" />,
  not_done: <X className="h-4 w-4 text-red-400" />,
}

const completionLabels: Record<string, string> = {
  completed: '已完成',
  partial: '部分完成',
  not_done: '未完成',
}

function getAccuracyColor(acc: number | null): string {
  if (acc === null) return 'text-muted-foreground'
  if (acc >= 90) return 'text-green-600 dark:text-green-400'
  if (acc >= 80) return 'text-yellow-600 dark:text-yellow-400'
  if (acc >= 60) return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}

function getAccuracyBarColor(acc: number | null): string {
  if (acc === null) return 'bg-muted'
  if (acc >= 90) return 'bg-green-500'
  if (acc >= 80) return 'bg-yellow-500'
  if (acc >= 60) return 'bg-orange-500'
  return 'bg-red-500'
}

export function QuizDetailTable({ data }: QuizDetailTableProps) {
  const [expanded, setExpanded] = React.useState(false)
  const displayData = expanded ? data : data.slice(0, 10)
  const hasMore = data.length > 10

  if (data.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">暂无小测记录</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          小测成绩明细
          <span className="text-xs font-normal text-muted-foreground ml-2">（共{data.length}次）</span>
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">日期</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">课时</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-muted-foreground">单词</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-muted-foreground">语法</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-muted-foreground">正确率</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-muted-foreground">完成</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  'border-b border-border/50 hover:bg-accent/30 transition-colors',
                  row.isAbsent && 'bg-muted/20 opacity-50',
                  row.wordAccuracy !== null && row.wordAccuracy < 80 && !row.isAbsent && 'bg-red-50/30 dark:bg-red-950/10',
                )}
              >
                <td className="px-4 py-3 text-sm whitespace-nowrap">
                  <span className={cn(row.isAbsent ? 'text-muted-foreground' : 'text-foreground')}>
                    {row.date || '—'}
                  </span>
                  {row.isAbsent && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                      缺勤
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                  {row.lessonLabel || '—'}
                </td>
                <td className="px-3 py-3 text-center text-sm whitespace-nowrap">
                  {row.isAbsent ? (
                    <span className="text-muted-foreground">—</span>
                  ) : row.wordScore != null ? (
                    <span className={getAccuracyColor(row.wordAccuracy)}>
                      {row.wordScore}/{row.wordTotal}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-3 text-center text-sm whitespace-nowrap">
                  {row.isAbsent ? (
                    <span className="text-muted-foreground">—</span>
                  ) : row.grammarScore != null ? (
                    <span className={getAccuracyColor(row.grammarAccuracy)}>
                      {row.grammarScore}/{row.grammarTotal}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-3 text-center text-sm whitespace-nowrap">
                  {row.isAbsent ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', getAccuracyBarColor(row.overallAccuracy ?? row.wordAccuracy))}
                          style={{ width: `${Math.min(row.overallAccuracy ?? row.wordAccuracy ?? 0, 100)}%` }}
                        />
                      </div>
                      <span className={cn('text-xs font-medium', getAccuracyColor(row.overallAccuracy ?? row.wordAccuracy))}>
                        {row.overallAccuracy ?? row.wordAccuracy ?? '—'}{row.overallAccuracy != null || row.wordAccuracy != null ? '%' : ''}
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-3 py-3 text-center whitespace-nowrap">
                  {completionIcons[row.completion] || completionIcons.not_done}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-6 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors flex items-center justify-center gap-2"
        >
          {expanded ? (
            <>收起 <ChevronUp className="h-4 w-4" /></>
          ) : (
            <>查看全部 {data.length} 次记录 <ChevronDown className="h-4 w-4" /></>
          )}
        </button>
      )}
    </div>
  )
}
