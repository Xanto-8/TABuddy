'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPushLogs } from '@/lib/store'
import { PushLogEntry } from '@/types'
import { PageContainer } from '@/components/ui/page-container'

export default function PushLogsPage() {
  const [logs, setLogs] = useState<PushLogEntry[]>([])

  useEffect(() => {
    setLogs(getPushLogs())
    const interval = setInterval(() => {
      setLogs(getPushLogs())
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  function getStatusIcon(status: string) {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'cancelled': return <Clock className="h-4 w-4 text-gray-400" />
      default: return null
    }
  }

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = { sent: '已发送', failed: '失败', cancelled: '已取消' }
    return labels[status] || status
  }

  function getReminderLabel(type: string) {
    return type === '60min' ? '课前60分钟' : '课前15分钟'
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center flex-wrap gap-3 justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">推送日志</h1>
            <p className="text-muted-foreground mt-1">查看课程打卡提醒的推送记录</p>
          </div>
          <button
            onClick={() => setLogs(getPushLogs())}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all whitespace-nowrap"
          >
            <Clock className="h-4 w-4" />
            刷新
          </button>
        </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FileText className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">暂无推送记录</p>
            <p className="text-xs mt-1">当有课程打卡提醒触发时，记录将显示在此处</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {logs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-6 py-4 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {getStatusIcon(log.status)}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">
                          {log.className}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {getReminderLabel(log.reminderType)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {log.message}
                      </p>
                      {log.errorMessage && (
                        <p className="text-xs text-red-500 mt-1">
                          错误: {log.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full font-medium',
                      log.status === 'sent'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : log.status === 'failed'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                    )}>
                      {getStatusLabel(log.status)}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        </div>
      </div>
    </PageContainer>
  )
}
