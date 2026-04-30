import { Injectable, Logger } from '@nestjs/common'
import { DeepseekService, ScenePromptRequest } from '../deepseek/deepseek.service'
import { CourseService } from '../course/course.service'
import { ReminderConfigService } from '../reminder-config/reminder-config.service'

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

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name)
  private readonly firedSet = new Set<string>()

  constructor(
    private readonly deepseekService: DeepseekService,
    private readonly courseService: CourseService,
    private readonly reminderConfigService: ReminderConfigService,
  ) {}

  async trigger(params: TriggerNotificationParams): Promise<NotificationResult> {
    const dedupKey = this.buildDedupKey(params)
    const title = this.buildTitle(params.scene, params.minutesBefore)

    const scenePrompt: ScenePromptRequest = {
      scene: this.mapScene(params.scene, params.minutesBefore),
      params: {
        ...(params.courseName ? { courseName: params.courseName } : {}),
        ...(params.workflowNodeName ? { workflowNodeName: params.workflowNodeName } : {}),
        ...(params.minutesBefore ? { minutesBefore: params.minutesBefore } : {}),
        ...params.extraParams,
      },
      context: params.context,
    }

    const message = await this.deepseekService.generateNotificationCopy(scenePrompt)

    const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    return { id, dedupKey, title, message, scene: params.scene, courseId: params.courseId, minutesBefore: params.minutesBefore }
  }

  async checkPreClassReminders(): Promise<NotificationResult[]> {
    const results: NotificationResult[] = []
    const now = Date.now()

    const courses = await this.courseService.getTodayCourses()
    const config = this.reminderConfigService.getConfig()

    for (const course of courses) {
      const classStart = new Date(course.startTime).getTime()
      const diffMs = classStart - now
      const diffMinutes = Math.round(diffMs / 60000)

      for (const interval of config.intervals) {
        const key = `pre_class_${interval}min::${course.id}`
        if (this.firedSet.has(key)) continue

        if (diffMinutes > 0 && diffMinutes <= interval && diffMinutes > interval - 2) {
          this.firedSet.add(key)

          const result = await this.trigger({
            scene: `pre_class_${interval}min`,
            courseId: course.id,
            courseName: course.name,
            startTime: course.startTime,
            minutesBefore: interval,
          })

          results.push(result)
          this.logger.log(`Pre-class reminder fired: ${course.name} (T-${interval}min)`)
        }
      }
    }

    return results
  }

  private mapScene(scene: string, minutesBefore?: number): ScenePromptRequest['scene'] {
    if (scene === 'pre_class_30min') return 'pre_class_30min'
    if (scene === 'pre_class_15min') return 'pre_class_15min'
    if (scene === 'pre_class') return 'pre_class'
    if (scene === 'in_class_node') return 'in_class_node'
    return (scene as ScenePromptRequest['scene']) || 'system_alert'
  }

  private buildTitle(scene: string, minutesBefore?: number): string {
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

  private buildDedupKey(params: TriggerNotificationParams): string {
    const parts = [params.scene]
    if (params.courseId) parts.push(`course_${params.courseId}`)
    if (params.workflowNodeId) parts.push(`node_${params.workflowNodeId}`)
    if (params.minutesBefore) parts.push(`t${params.minutesBefore}`)
    return parts.join('::')
  }
}
