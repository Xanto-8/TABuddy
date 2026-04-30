export interface TriggerNotificationDto {
  scene: string
  courseId?: string
  courseName?: string
  startTime?: string
  endTime?: string
  workflowNodeId?: string
  workflowNodeName?: string
  extraParams?: Record<string, string | number | boolean>
  context?: string
  minutesBefore?: number
}

export interface NotificationResult {
  id: string
  dedupKey: string
  title: string
  message: string
  scene: string
}

interface FireWorkflowNodeReminderDto {
  classId: string
  className: string
  courseType: string
  workflowNodeId: string
  workflowNodeName: string
}

interface WorkflowNodeReminderResult {
  id: string
  dedupKey: string
  title: string
  message: string
  scene: string
  classId: string
  workflowNodeId: string
  workflowNodeName: string
}

interface CourseInfo {
  id: string
  name: string
  startTime: string
  endTime: string
}

const api = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
  },

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`)
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
  },
}

async function trigger(params: TriggerNotificationDto): Promise<NotificationResult> {
  const data = await api.post<{ success: boolean; data: NotificationResult }>('/notifications/trigger', params)
  return data.data
}

async function preview(params: TriggerNotificationDto): Promise<NotificationResult> {
  const data = await api.post<{ success: boolean; data: NotificationResult }>('/notifications/preview', params)
  return data.data
}

async function checkPreClassReminders(): Promise<NotificationResult[]> {
  const data = await api.post<{ success: boolean; data: NotificationResult[] }>('/notifications/check-pre-class', {})
  return data.data
}

async function fireWorkflowNodeReminder(params: FireWorkflowNodeReminderDto): Promise<WorkflowNodeReminderResult> {
  const data = await api.post<{ success: boolean; data: WorkflowNodeReminderResult }>('/workflow-node-reminder/fire', params)
  return data.data
}

async function completeWorkflowNodeReminder(params: {
  reminderId: string
  classId: string
  workflowNodeId: string
}): Promise<{ success: boolean }> {
  const data = await api.post<{ success: boolean; data: { success: boolean } }>('/workflow-node-reminder/complete', params)
  return data.data
}

async function getTodayCourses(): Promise<CourseInfo[]> {
  const data = await api.get<{ success: boolean; data: CourseInfo[] }>('/courses/today')
  return data.data
}

export const NotificationApi = {
  trigger,
  preview,
  checkPreClassReminders,
  fireWorkflowNodeReminder,
  completeWorkflowNodeReminder,
  getTodayCourses,
}
