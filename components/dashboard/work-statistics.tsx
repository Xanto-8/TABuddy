'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, FileText, MessageSquare, TrendingUp, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkStats {
  today: {
    completedTasks: number
    gradedHomework: number
    processedFeedback: number
    className: string | null
  }
  week: {
    completedTasks: number
    gradedHomework: number
    processedFeedback: number
    totalTarget: number
    completionRate: number
  }
}

interface Props {
  workStats: WorkStats
  onRefresh: () => void
}

const statItems = [
  { key: 'completedTasks' as const, label: '完成任务', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
  { key: 'gradedHomework' as const, label: '批改作业', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20' },
  { key: 'processedFeedback' as const, label: '处理反馈', icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/20' },
]

export function WorkStatistics({ workStats, onRefresh }: Props) {
  const todayStats = useMemo(() => [
    { ...statItems[0], value: workStats.today.completedTasks },
    { ...statItems[1], value: workStats.today.gradedHomework },
    { ...statItems[2], value: workStats.today.processedFeedback },
  ], [workStats.today])

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">今日工作统计</h3>
        </div>
        <button
          onClick={onRefresh}
          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="刷新数据"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      <motion.div
        className="space-y-3"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.06 } },
        }}
      >
        {todayStats.map((item) => (
          <motion.div
            key={item.key}
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={cn(
              'flex items-center justify-between p-3 rounded-lg border border-border/50',
              item.bg
            )}
          >
            <div className="flex items-center gap-2.5">
              <item.icon className={cn('h-4 w-4', item.color)} />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
            <motion.span
              key={item.value}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="text-sm font-bold text-foreground tabular-nums"
            >
              {item.value}
            </motion.span>
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-4 pt-3 border-t border-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">本周进度</span>
          <span className="font-medium text-foreground tabular-nums">
            {workStats.week.completionRate}%
          </span>
        </div>
        <div className="mt-1.5 w-full h-1.5 rounded-full bg-primary/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(workStats.week.completionRate, 100)}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">
          已完成 {workStats.week.completedTasks}/{workStats.week.totalTarget} 项任务
        </p>
      </div>
    </div>
  )
}
