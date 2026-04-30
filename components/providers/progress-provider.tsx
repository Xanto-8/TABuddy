'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react'
import { Task, Class } from '@/types'
import { getCurrentClassByTime, getCourseTasksByClassAndDate } from '@/lib/store'

interface ProgressContextType {
  totalTasks: number
  completedTasks: number
  todayTasks: Task[]
  progress: number
  currentClass: Class | null
  courseTotalTasks: number
  courseCompletedTasks: number
  courseProgress: number
  showCelebration: boolean
  updateProgress: (tasks: Task[]) => void
  addTask: (task: Task) => void
  completeTask: (taskId: string) => void
  updateCurrentClass: () => void
  refreshCourseProgress: (classId?: string, date?: string) => void
  dismissCelebration: () => void
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [totalTasks, setTotalTasks] = useState(0)
  const [completedTasks, setCompletedTasks] = useState(0)
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [currentClass, setCurrentClass] = useState<Class | null>(null)
  const [courseTotalTasks, setCourseTotalTasks] = useState(0)
  const [courseCompletedTasks, setCourseCompletedTasks] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const [lastCelebratedKey, setLastCelebratedKey] = useState('')

  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const courseProgress = courseTotalTasks > 0 ? Math.round((courseCompletedTasks / courseTotalTasks) * 100) : 0

  const dismissCelebration = useCallback(() => {
    setShowCelebration(false)
  }, [])

  const refreshCourseProgress = useCallback((classId?: string, date?: string) => {
    const targetClassId = classId || currentClass?.id
    const targetDate = date || new Date().toISOString().split('T')[0]

    if (!targetClassId) {
      setCourseTotalTasks(0)
      setCourseCompletedTasks(0)
      return
    }
    const courseTasks = getCourseTasksByClassAndDate(targetClassId, targetDate)
    const completed = courseTasks.filter(t => t.completed).length

    setCourseTotalTasks(courseTasks.length)
    setCourseCompletedTasks(completed)
  }, [currentClass])

  const updateCurrentClass = useCallback(() => {
    const detectedClass = getCurrentClassByTime()
    setCurrentClass(detectedClass)
  }, [])

  // 检测进度达到100%时触发庆祝动画
  useEffect(() => {
    const currentKey = currentClass ? `${currentClass.id}_${new Date().toISOString().split('T')[0]}` : ''

    const isNowComplete = courseCompletedTasks > 0 && courseCompletedTasks === courseTotalTasks

    if (isNowComplete && currentKey !== lastCelebratedKey && currentKey) {
      setShowCelebration(true)
      setLastCelebratedKey(currentKey)
    }

    if (!isNowComplete && currentKey === lastCelebratedKey) {
      setLastCelebratedKey('')
    }
  }, [courseCompletedTasks, courseTotalTasks, currentClass, lastCelebratedKey])

  // 当 currentClass 变化时，自动刷新课程进度
  useEffect(() => {
    refreshCourseProgress()
  }, [currentClass, refreshCourseProgress])

  // 初始化时获取当前上课班级
  useEffect(() => {
    updateCurrentClass()
    const interval = setInterval(updateCurrentClass, 60000)
    return () => clearInterval(interval)
  }, [updateCurrentClass])

  const updateProgress = (tasks: Task[]) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayTasks = tasks.filter(task => {
      const taskDate = new Date(task.createdAt)
      taskDate.setHours(0, 0, 0, 0)
      return taskDate.getTime() === today.getTime()
    })

    const completed = tasks.filter(task => task.status === 'completed').length

    setTotalTasks(tasks.length)
    setCompletedTasks(completed)
    setTodayTasks(todayTasks)
  }

  const addTask = (task: Task) => {
    setTotalTasks(prev => prev + 1)
    setTodayTasks(prev => [...prev, task])
  }

  const completeTask = (taskId: string) => {
    setCompletedTasks(prev => prev + 1)
    setTodayTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, status: 'completed', completedAt: new Date() } : task
      )
    )
  }

  return (
    <ProgressContext.Provider
      value={{
        totalTasks,
        completedTasks,
        todayTasks,
        progress,
        currentClass,
        courseTotalTasks,
        courseCompletedTasks,
        courseProgress,
        showCelebration,
        updateProgress,
        addTask,
        completeTask,
        updateCurrentClass,
        refreshCourseProgress,
        dismissCelebration,
      }}
    >
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress() {
  const context = useContext(ProgressContext)
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider')
  }
  return context
}
