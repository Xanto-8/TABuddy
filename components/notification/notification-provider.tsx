'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { NotificationItem, ServerNotification } from '@/types'
import {
  getUnreadNotifications,
  getActiveNotifications,
  getNotifications,
  markNotificationRead,
  markNotificationCompleted,
  dismissNotification as dismissStoreNotification,
  dismissAllActiveNotifications as dismissAllStoreNotifications,
  markNotificationsCompletedByClass,
} from '@/lib/store'
import { useReminderScheduler, useCheckInStatusWatcher } from '@/lib/reminder-scheduler'

interface NotificationContextValue {
  unreadCount: number
  activeNotifications: NotificationItem[]
  allNotifications: NotificationItem[]
  refresh: () => void
  markRead: (id: string) => void
  markCompleted: (id: string) => void
  dismiss: (id: string) => void
  dismissAll: () => void
  markCompletedByClass: (classId: string) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function useNotification() {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return ctx
}

function toNotificationItem(sn: ServerNotification): NotificationItem {
  return {
    id: sn.id,
    title: sn.title,
    message: sn.message,
    type: sn.type === 'feedback' ? 'feedback' : 'info',
    read: sn.read,
    link: sn.link,
    createdAt: new Date(sn.createdAt),
    classId: '',
    className: '',
    dismissed: false,
    completed: false,
  } as NotificationItem
}

async function fetchServerNotifications(): Promise<NotificationItem[]> {
  try {
    const res = await fetch('/api/data/notifications')
    if (!res.ok) return []
    const result = await res.json()
    if (!result.data || !Array.isArray(result.data)) return []
    return (result.data as ServerNotification[]).map(toNotificationItem)
  } catch {
    return []
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeNotifications, setActiveNotifications] = useState<NotificationItem[]>([])
  const [allNotifications, setAllNotifications] = useState<NotificationItem[]>([])

  useReminderScheduler()
  useCheckInStatusWatcher()

  const mergeNotifications = useCallback((local: NotificationItem[], server: NotificationItem[]) => {
    const serverIds = new Set(server.map(n => n.id))
    const merged = [...server, ...local.filter(n => !serverIds.has(n.id))]
    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return merged
  }, [])

  const refresh = useCallback(async () => {
    const localAll = getNotifications()
    const localUnread = getUnreadNotifications()
    const localActive = getActiveNotifications()

    const serverAll = await fetchServerNotifications()
    const mergedAll = mergeNotifications(localAll, serverAll)
    const mergedUnread = mergedAll.filter(n => !n.read && !n.dismissed)

    setUnreadCount(mergedUnread.length)
    setActiveNotifications(mergeNotifications(localActive, serverAll.filter(n => !n.dismissed)))
    setAllNotifications(mergedAll)
  }, [mergeNotifications])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [refresh])

  const markRead = useCallback(async (id: string) => {
    markNotificationRead(id)
    try {
      await fetch(`/api/data/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      })
    } catch {}
    refresh()
  }, [refresh])

  const markCompleted = useCallback((id: string) => {
    markNotificationCompleted(id)
    refresh()
  }, [refresh])

  const dismiss = useCallback((id: string) => {
    dismissStoreNotification(id)
    refresh()
  }, [refresh])

  const dismissAll = useCallback(() => {
    dismissAllStoreNotifications()
    refresh()
  }, [refresh])

  const markCompletedByClass = useCallback((classId: string) => {
    markNotificationsCompletedByClass(classId)
    refresh()
  }, [refresh])

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        activeNotifications,
        allNotifications,
        refresh,
        markRead,
        markCompleted,
        dismiss,
        dismissAll,
        markCompletedByClass,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
