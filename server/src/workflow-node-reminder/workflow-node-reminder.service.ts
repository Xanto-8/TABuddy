import { Injectable, Logger } from '@nestjs/common'
import { DeepseekService, ScenePromptRequest } from '../deepseek/deepseek.service'

export interface WorkflowNodeReminderResult {
  id: string
  dedupKey: string
  title: string
  message: string
  scene: string
  classId: string
  workflowNodeId: string
  workflowNodeName: string
}

@Injectable()
export class WorkflowNodeReminderService {
  private readonly logger = new Logger(WorkflowNodeReminderService.name)
  private readonly completedSet = new Set<string>()

  constructor(private readonly deepseekService: DeepseekService) {}

  async fire(params: {
    classId: string
    className: string
    courseType: string
    workflowNodeId: string
    workflowNodeName: string
  }): Promise<WorkflowNodeReminderResult> {
    const dedupKey = `in_class_node::class_${params.classId}::node_${params.workflowNodeId}`

    const scenePrompt: ScenePromptRequest = {
      scene: 'in_class_node',
      params: {
        className: params.className,
        courseType: params.courseType,
        workflowNodeName: params.workflowNodeName,
      },
    }

    const message = await this.deepseekService.generateNotificationCopy(scenePrompt)

    const id = `in_class_reminder_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    return {
      id,
      dedupKey,
      title: params.workflowNodeName,
      message,
      scene: 'in_class_node',
      classId: params.classId,
      workflowNodeId: params.workflowNodeId,
      workflowNodeName: params.workflowNodeName,
    }
  }

  async markComplete(params: {
    reminderId: string
    classId: string
    workflowNodeId: string
  }): Promise<{ success: boolean }> {
    const key = `class_${params.classId}::node_${params.workflowNodeId}`
    this.completedSet.add(key)
    this.logger.log(`Workflow node reminder marked complete: ${key}`)
    return { success: true }
  }

  isCompleted(classId: string, workflowNodeId: string): boolean {
    const key = `class_${classId}::node_${workflowNodeId}`
    return this.completedSet.has(key)
  }

  getCompletedNodes(classId: string): string[] {
    const prefix = `class_${classId}::node_`
    return Array.from(this.completedSet)
      .filter(k => k.startsWith(prefix))
      .map(k => k.replace(prefix, ''))
  }

  resetClassProgress(classId: string): void {
    const prefix = `class_${classId}::node_`
    for (const key of this.completedSet) {
      if (key.startsWith(prefix)) {
        this.completedSet.delete(key)
      }
    }
  }
}
