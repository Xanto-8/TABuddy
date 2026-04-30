import { httpClient } from './client'
import type { TaskReminderDto } from './types'
import { getCourseTasks, getClasses } from '@/lib/store'

class TaskService {
  async getTodayTasks(): Promise<TaskReminderDto[]> {
    try {
      return await httpClient.get<TaskReminderDto[]>('/tasks/today')
    } catch {
      const todayStr = new Date().toISOString().split('T')[0]
      const allTasks = getCourseTasks()
      const classes = getClasses()

      return allTasks
        .filter(t => t.date === todayStr)
        .map(t => {
          const cls = classes.find(c => c.id === t.classId)
          return {
            id: t.id,
            title: t.title,
            description: t.content || '',
            classId: t.classId,
            className: cls?.name || '未知班级',
            dueDate: t.date,
            priority: 'medium' as const,
            status: (t.completed ? 'completed' : 'pending') as 'pending' | 'completed',
            type: 'other',
          } satisfies TaskReminderDto
        })
        .sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        })
    }
  }

  async getUpcomingDeadlines(): Promise<TaskReminderDto[]> {
    try {
      return await httpClient.get<TaskReminderDto[]>('/tasks/upcoming')
    } catch {
      const todayStr = new Date().toISOString().split('T')[0]
      const allTasks = getCourseTasks()
      const classes = getClasses()

      return allTasks
        .filter(t => !t.completed && t.date >= todayStr)
        .map(t => {
          const cls = classes.find(c => c.id === t.classId)
          return {
            id: t.id,
            title: t.title,
            description: t.content || '',
            classId: t.classId,
            className: cls?.name || '未知班级',
            dueDate: t.date,
            priority: 'medium' as const,
            status: (t.completed ? 'completed' : 'pending') as 'pending' | 'completed',
            type: 'other',
          } satisfies TaskReminderDto
        })
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 10)
    }
  }

  async completeTask(taskId: string): Promise<void> {
    await httpClient.patch(`/tasks/${taskId}/complete`)
  }
}

export const taskService = new TaskService()
