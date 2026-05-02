'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
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
  markAllRead: () => void
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
    const token = localStorage.getItem(TOKEN_KEY)
    const res = await fetch('/api/data/notifications', {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    })
    if (!res.ok) return []
    const result = await res.json()
    if (!result.data || !Array.isArray(result.data)) return []
    return (result.data as ServerNotification[]).map(toNotificationItem)
  } catch {
    return []
  }
}

const TOKEN_KEY = 'tabuddy_auth_token'

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeNotifications, setActiveNotifications] = useState<NotificationItem[]>([])
  const [allNotifications, setAllNotifications] = useState<NotificationItem[]>([])
  const sseConnectedRef = useRef(false)

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

    let eventSource: EventSource | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let destroyed = false

    function connectSSE() {
      const token = localStorage.getItem(TOKEN_KEY)
      if (!token) {
        reconnectTimer = setTimeout(connectSSE, 3000)
        return
      }

      try {
        const es = new EventSource(`/api/data/notifications/stream?token=${encodeURIComponent(token)}`)
        eventSource = es

        es.addEventListener('notification', () => {
          refresh()
        })

        es.onopen = () => {
          sseConnectedRef.current = true
        }

        es.onerror = () => {
          sseConnectedRef.current = false
          es.close()
          eventSource = null
          if (!destroyed) {
            reconnectTimer = setTimeout(connectSSE, 5000)
          }
        }
      } catch {
        if (!destroyed) {
          reconnectTimer = setTimeout(connectSSE, 5000)
        }
      }
    }

    connectSSE()

    const fallbackInterval = setInterval(refresh, 30000)

    return () => {
      destroyed = true
      clearInterval(fallbackInterval)
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (eventSource) {
        eventSource.close()
        eventSource = null
      }
    }
  }, [refresh])

  const markAllRead = useCallback(async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      await fetch('/api/data/notifications/read-all', {
        method: 'PUT',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
    } catch {}
    refresh()
  }, [refresh])

  const markRead = useCallback(async (id: string) => {
    markNotificationRead(id)
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      await fetch(`/api/data/notifications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
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
        markAllRead,
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
