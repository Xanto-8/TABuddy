'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { NotificationItem } from '@/types'
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

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeNotifications, setActiveNotifications] = useState<NotificationItem[]>([])
  const [allNotifications, setAllNotifications] = useState<NotificationItem[]>([])

  useReminderScheduler()
  useCheckInStatusWatcher()

  const refresh = useCallback(() => {
    setUnreadCount(getUnreadNotifications().length)
    setActiveNotifications(getActiveNotifications())
    setAllNotifications(getNotifications())
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [refresh])

  const markRead = useCallback((id: string) => {
    markNotificationRead(id)
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
