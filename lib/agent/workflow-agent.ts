import type { AgentAction, AgentResult, AgentHandler } from './types'
import { getClasses, getCurrentClassByTime } from '@/lib/store'
import {
  getOrCreateWorkflowTemplate,
  getWorkflowTemplateByCourseType,
  saveWorkflowTemplate,
} from '@/lib/workflow-store'
import type { WorkflowNodeType, ClassType, WorkflowNode } from '@/types'
import { WORKFLOW_NODE_LABELS } from '@/types'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}

function findActiveClass(className?: string) {
  if (className) {
    const classes = getClasses()
    return classes.find(c => c.name.includes(className.trim())) || null
  }
  return getCurrentClassByTime()
}

export const handleAddWorkflowTask: AgentHandler = (action: AgentAction) => {
  const { taskName, className, taskStage, taskPosition, requirePhoto, isRequiredTask } = action.params
  if (!taskName) {
    return { success: false, message: '请告诉我需要添加的工作流任务名称', syncTo: '', needMoreInfo: true, followUpQuestion: '您想添加什么任务呢？' }
  }
  const cls = findActiveClass(className)
  if (!cls) {
    return { success: false, message: '未找到对应的班级，请先创建班级或在班级上课时段操作', syncTo: '班级管理' }
  }
  const template = getOrCreateWorkflowTemplate(cls.type as ClassType)

  const displayName = requirePhoto ? `📸 ${taskName.trim()}` : taskName.trim()

  const newNode: WorkflowNode = {
    id: generateId(),
    type: 'custom' as WorkflowNodeType,
    enabled: true,
    order: taskPosition !== undefined ? taskPosition : template.nodes.length,
    nodeCategory: isRequiredTask ? 'required' as const : 'optional' as const,
    countInTodo: true,
    isCustom: true,
    customName: displayName,
  }

  if (taskStage) {
    newNode.description = taskStage
  }

  const insertAt = taskPosition !== undefined ? Math.min(taskPosition, template.nodes.length) : template.nodes.length
  template.nodes.splice(insertAt, 0, newNode)

  template.nodes.forEach((n, i) => {
    n.order = i
  })

  saveWorkflowTemplate(
    {
      courseType: template.courseType,
      name: template.name,
      isCustom: template.isCustom,
      nodes: template.nodes,
    },
    template.id
  )
  window.dispatchEvent(new Event('classDataChanged'))
  return {
    success: true,
    message: `已为「${cls.name}」工作流添加任务「${displayName}」`,
    syncTo: '工作流配置',
  }
}

export const handleReorderWorkflowTasks: AgentHandler = (action: AgentAction) => {
  const { className } = action.params
  const cls = findActiveClass(className)
  if (!cls) {
    return { success: false, message: '未找到对应的班级', syncTo: '' }
  }
  const template = getWorkflowTemplateByCourseType(cls.type as ClassType)
  if (!template) {
    return { success: false, message: `「${cls.name}」暂无工作流模板`, syncTo: '工作流配置' }
  }
  const sortedNodes = [...template.nodes].sort((a, b) => a.order - b.order)
  const nodeList = sortedNodes
    .map((n, i) => `${i + 1}. ${n.customName || WORKFLOW_NODE_LABELS[n.type] || n.type}${n.enabled ? '' : '（已禁用）'}`)
    .join('\n')
  return {
    success: true,
    message: `「${cls.name}」当前工作流任务顺序：\n${nodeList}\n\n如需调整顺序，请告知新的排列方式（如：将「批改作业」移到第一位）`,
    syncTo: '工作流配置',
    data: { template, sortedNodes },
  }
}

export const handleAddPhotoReminder: AgentHandler = (action: AgentAction) => {
  const { className } = action.params
  const cls = findActiveClass(className)
  if (!cls) {
    return { success: false, message: '未找到对应的班级，请先创建班级或在班级上课时段操作', syncTo: '班级管理' }
  }
  const template = getOrCreateWorkflowTemplate(cls.type as ClassType)
  const photoNode = template.nodes.find(
    n => n.customName?.includes('拍照') || n.customName?.includes('照片') || n.customName?.includes('拍摄')
  )
  if (photoNode) {
    photoNode.enabled = true
    photoNode.nodeCategory = 'optional'
    saveWorkflowTemplate(
      {
        courseType: template.courseType,
        name: template.name,
        isCustom: template.isCustom,
        nodes: template.nodes,
      },
      template.id
    )
    window.dispatchEvent(new Event('classDataChanged'))
    return {
      success: true,
      message: `已启用「${photoNode.customName}」拍照提醒任务`,
      syncTo: '工作流配置',
    }
  }
  const newNode: WorkflowNode = {
    id: generateId(),
    type: 'custom' as WorkflowNodeType,
    enabled: true,
    order: template.nodes.length,
    nodeCategory: 'optional' as const,
    countInTodo: true,
    isCustom: true,
    customName: '拍照提醒',
  }
  template.nodes.push(newNode)
  saveWorkflowTemplate(
    {
      courseType: template.courseType,
      name: template.name,
      isCustom: template.isCustom,
      nodes: template.nodes,
    },
    template.id
  )
  window.dispatchEvent(new Event('classDataChanged'))
  return {
    success: true,
    message: `已为「${cls.name}」工作流添加「拍照提醒」可选任务`,
    syncTo: '工作流配置',
  }
}
