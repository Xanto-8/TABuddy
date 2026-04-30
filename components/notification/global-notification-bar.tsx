'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Clock, CheckCircle } from 'lucide-react'
import { useNotification } from './notification-provider'
import { cn } from '@/lib/utils'
import type { ReminderType } from '@/types'

export function GlobalNotificationBar() {
  const { activeNotifications, dismiss, dismissAll, markCompleted } = useNotification()

  const checkinNotifications = activeNotifications.filter(
    n => n.type === '15min' || n.type === '30min' || n.type === '60min'
  )

  if (checkinNotifications.length === 0) return null

  const hasUrgent = checkinNotifications.some(n => n.type === '15min')
  const nonUrgent = checkinNotifications.filter(n => n.type === '60min' || n.type === '30min')
  const urgent = checkinNotifications.filter(n => n.type === '15min')

  function getBarStyle(type: ReminderType) {
    if (type === '15min') {
      return 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/50 dark:border-amber-700 dark:text-amber-200'
    }
    return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300'
  }

  function getIconColor(type: ReminderType) {
    if (type === '15min') return 'text-amber-600 dark:text-amber-400'
    return 'text-blue-500'
  }

  function renderBar(notification: typeof activeNotifications[0]) {
    return (
      <motion.div
        key={notification.id}
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'border-b px-6 py-3 flex items-center justify-between gap-4',
          getBarStyle(notification.type)
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Bell className={cn('h-5 w-5 flex-shrink-0', getIconColor(notification.type))} />
          <span className="text-sm font-medium truncate">{notification.message}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => markCompleted(notification.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white/80 hover:bg-white shadow-sm border border-current/20 transition-all"
            title="标记为已打卡"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            已打卡
          </button>
          <button
            onClick={() => dismiss(notification.id)}
            className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="relative">
      <AnimatePresence>
        {urgent.map(renderBar)}
        {nonUrgent.map(renderBar)}
      </AnimatePresence>
      {activeNotifications.length > 1 && (
        <div
          className="border-b border-border/50 px-6 py-1.5 flex justify-center bg-muted/30"
        >
          <button
            onClick={dismissAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            关闭全部提醒
          </button>
        </div>
      )}
    </div>
  )
}
