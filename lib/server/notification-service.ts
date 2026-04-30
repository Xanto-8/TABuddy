import { generateNotificationCopy, ScenePromptRequest } from './deepseek'
import { getTodayCourses } from './course-service'
import { getConfig } from './reminder-config'

export interface NotificationResult {
  id: string
  dedupKey: string
  title: string
  message: string
  scene: string
  courseId?: string
  minutesBefore?: number
}

export interface TriggerNotificationParams {
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

const firedSet = new Set<string>()

export async function triggerNotification(params: TriggerNotificationParams): Promise<NotificationResult> {
  const dedupKey = buildDedupKey(params)
  const title = buildTitle(params.scene, params.minutesBefore)

  const scenePrompt: ScenePromptRequest = {
    scene: mapScene(params.scene, params.minutesBefore),
    params: {
      ...(params.courseName ? { courseName: params.courseName } : {}),
      ...(params.workflowNodeName ? { workflowNodeName: params.workflowNodeName } : {}),
      ...(params.minutesBefore ? { minutesBefore: params.minutesBefore } : {}),
      ...params.extraParams,
    },
    context: params.context,
  }

  const message = await generateNotificationCopy(scenePrompt)

  const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  return { id, dedupKey, title, message, scene: params.scene, courseId: params.courseId, minutesBefore: params.minutesBefore }
}

export async function checkPreClassReminders(): Promise<NotificationResult[]> {
  const results: NotificationResult[] = []
  const now = Date.now()

  const courses = getTodayCourses()
  const remConfig = getConfig()

  for (const course of courses) {
    const classStart = new Date(course.startTime).getTime()
    const diffMs = classStart - now
    const diffMinutes = Math.round(diffMs / 60000)

    for (const interval of remConfig.intervals) {
      const key = `pre_class_${interval}min::${course.id}`
      if (firedSet.has(key)) continue

      if (diffMinutes > 0 && diffMinutes <= interval && diffMinutes > interval - 2) {
        firedSet.add(key)

        const result = await triggerNotification({
          scene: `pre_class_${interval}min`,
          courseId: course.id,
          courseName: course.name,
          startTime: course.startTime,
          minutesBefore: interval,
        })

        results.push(result)
        console.log(`Pre-class reminder fired: ${course.name} (T-${interval}min)`)
      }
    }
  }

  return results
}

function mapScene(scene: string, minutesBefore?: number): ScenePromptRequest['scene'] {
  if (scene === 'pre_class_30min') return 'pre_class_30min'
  if (scene === 'pre_class_15min') return 'pre_class_15min'
  if (scene === 'pre_class') return 'pre_class'
  if (scene === 'in_class_node') return 'in_class_node'
  return (scene as ScenePromptRequest['scene']) || 'system_alert'
}

function buildTitle(scene: string, minutesBefore?: number): string {
  switch (scene) {
    case 'pre_class_30min':
      return '课前30分钟提醒'
    case 'pre_class_15min':
      return '课前15分钟提醒'
    case 'pre_class':
      return '课前提醒'
    case 'in_class_node':
      return '课中节点提醒'
    case 'in_class':
      return '课堂提醒'
    case 'post_class':
      return '课后提醒'
    case 'workflow_todo':
      return '工作流待办'
    case 'system_alert':
      return '系统通知'
    default:
      return '新通知'
  }
}

function buildDedupKey(params: TriggerNotificationParams): string {
  const parts = [params.scene]
  if (params.courseId) parts.push(`course_${params.courseId}`)
  if (params.workflowNodeId) parts.push(`node_${params.workflowNodeId}`)
  if (params.minutesBefore) parts.push(`t${params.minutesBefore}`)
  return parts.join('::')
}
