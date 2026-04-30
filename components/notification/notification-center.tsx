'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Clock, CheckCircle, ExternalLink, Trash2 } from 'lucide-react'
import { useNotification } from './notification-provider'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import type { ReminderType } from '@/types'

export function NotificationCenter() {
  const { unreadCount, allNotifications, markRead, dismiss } = useNotification()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'unread' | 'all'>('unread')
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const filteredNotifications = activeTab === 'unread'
    ? allNotifications.filter(n => !n.read && !n.dismissed)
    : allNotifications.slice(0, 50)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  function handleNotificationClick(n: typeof allNotifications[0]) {
    markRead(n.id)
    router.push(`/tasks?classId=${n.classId}`)
    setIsOpen(false)
  }

  function getDotColor(type: ReminderType) {
    if (type === 'workflow_node') return 'bg-green-500'
    if (type === '15min') return 'bg-amber-500'
    if (type === '30min') return 'bg-blue-500'
    return 'bg-blue-500'
  }

  function getTypeLabel(type: ReminderType) {
    if (type === 'workflow_node') return '课中节点提醒'
    if (type === '15min') return '课前15分钟'
    if (type === '30min') return '课前30分钟'
    return '课前1小时'
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-accent transition-colors"
        title="通知中心"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-border bg-card shadow-xl z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">通知中心</h3>
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab('unread')}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                    activeTab === 'unread'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  未读
                </button>
                <button
                  onClick={() => setActiveTab('all')}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                    activeTab === 'all'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  全部
                </button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Bell className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">暂无通知</p>
                </div>
              ) : (
                filteredNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 border-b border-border/50 cursor-pointer transition-colors hover:bg-accent/50',
                      !n.read && 'bg-primary/5'
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className={cn('h-2 w-2 rounded-full mt-1.5', getDotColor(n.type))} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {getTypeLabel(n.type)}
                        </span>
                        {!n.read && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            新
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-muted-foreground">
                          {n.className}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            dismiss(n.id)
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
                        >
                          忽略
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-4 py-2.5 border-t border-border/50">
              <button
                onClick={() => {
                  router.push('/push-logs')
                  setIsOpen(false)
                }}
                className="w-full text-xs text-center text-muted-foreground hover:text-foreground transition-colors"
              >
                查看推送日志
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
