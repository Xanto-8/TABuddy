'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Class } from '@/types'
import { getCurrentClassByTime } from '@/lib/store'

const STORAGE_KEY = 'tabuddy_last_class_id'

export function getAutoSelectedClassId(classes: Class[]): string | null {
  const currentClass = getCurrentClassByTime()
  if (currentClass && classes.some(c => c.id === currentClass.id)) {
    return currentClass.id
  }

  if (typeof window !== 'undefined') {
    const lastClassId = localStorage.getItem(STORAGE_KEY)
    if (lastClassId && classes.some(c => c.id === lastClassId)) {
      return lastClassId
    }
  }

  if (classes.length > 0) {
    return classes[0].id
  }

  return null
}

export function saveManualClassSelection(classId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, classId)
  }
}

export function useCurrentTeachingClass(): string | null {
  const [teachingClassId, setTeachingClassId] = useState<string | null>(null)

  useEffect(() => {
    const check = () => {
      const current = getCurrentClassByTime()
      setTeachingClassId(current?.id || null)
    }
    check()
    const interval = setInterval(check, 60000)
    return () => clearInterval(interval)
  }, [])

  return teachingClassId
}

export function useAutoClass(classes: Class[]): {
  autoSelectedId: string | null
  teachingClassId: string | null
  isTeachingClass: (classId: string) => boolean
  saveManualSelection: (classId: string) => void
} {
  const teachingClassId = useCurrentTeachingClass()
  const [autoSelectedId, setAutoSelectedId] = useState<string | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (classes.length === 0) return
    if (initialized.current) return
    initialized.current = true
    setAutoSelectedId(getAutoSelectedClassId(classes))
  }, [classes])

  const isTeachingClass = useCallback(
    (classId: string) => teachingClassId === classId,
    [teachingClassId]
  )

  const saveManualSelection = useCallback((classId: string) => {
    saveManualClassSelection(classId)
  }, [])

  return { autoSelectedId, teachingClassId, isTeachingClass, saveManualSelection }
}
