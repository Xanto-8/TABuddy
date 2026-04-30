import { generateNotificationCopy, ScenePromptRequest } from './deepseek'

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

const completedSet = new Set<string>()

export async function fireWorkflowReminder(params: {
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

  const message = await generateNotificationCopy(scenePrompt)

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

export function markWorkflowComplete(params: {
  reminderId: string
  classId: string
  workflowNodeId: string
}): { success: boolean } {
  const key = `class_${params.classId}::node_${params.workflowNodeId}`
  completedSet.add(key)
  return { success: true }
}

export function isWorkflowCompleted(classId: string, workflowNodeId: string): boolean {
  const key = `class_${classId}::node_${workflowNodeId}`
  return completedSet.has(key)
}

export function getCompletedNodes(classId: string): string[] {
  const prefix = `class_${classId}::node_`
  return Array.from(completedSet)
    .filter(k => k.startsWith(prefix))
    .map(k => k.replace(prefix, ''))
}

export function resetClassProgress(classId: string): void {
  const prefix = `class_${classId}::node_`
  Array.from(completedSet).forEach((key) => {
    if (key.startsWith(prefix)) {
      completedSet.delete(key)
    }
  })
}
