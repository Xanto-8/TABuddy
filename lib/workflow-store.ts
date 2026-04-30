'use client'

import type { ClassType, WorkflowTemplate, WorkflowNode, WorkflowTodo, WorkflowNodeType } from '@/types'
import {
  DEFAULT_WORKFLOW_NODES,
  WORKFLOW_NODE_LABELS,
} from '@/types'

const WORKFLOW_TEMPLATES_KEY = 'tabuddy_workflow_templates'
const WORKFLOW_TODOS_KEY = 'tabuddy_workflow_todos'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}

function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return defaultValue
    return JSON.parse(stored, (_, value) => {
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
        return new Date(value)
      }
      return value
    })
  } catch {
    return defaultValue
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save to localStorage:', e)
  }
}

function createDefaultNodes(): WorkflowNode[] {
  return DEFAULT_WORKFLOW_NODES.map((type, index) => ({
    id: generateId(),
    type,
    enabled: true,
    order: index,
    nodeCategory: 'required',
    countInTodo: true,
    isCustom: false,
  }))
}

export function getWorkflowTemplates(): WorkflowTemplate[] {
  return getFromStorage<WorkflowTemplate[]>(WORKFLOW_TEMPLATES_KEY, [])
}

export function getWorkflowTemplateByCourseType(courseType: ClassType): WorkflowTemplate | undefined {
  const templates = getWorkflowTemplates()
  return templates.find((t) => t.courseType === courseType && !t.isCustom)
}

export function getWorkflowTemplateById(templateId: string): WorkflowTemplate | undefined {
  const templates = getWorkflowTemplates()
  return templates.find((t) => t.id === templateId)
}

export function getOrCreateWorkflowTemplate(courseType: ClassType): WorkflowTemplate {
  const existing = getWorkflowTemplateByCourseType(courseType)
  if (existing) return existing

  const COURSE_TYPE_LABELS: Record<ClassType, string> = {
    GY: 'GY',
    KET: 'KET',
    PET: 'PET',
    FCE: 'FCE',
    CAE: 'CAE',
    CPE: 'CPE',
    OTHER: '其他',
  }

  const newTemplate: WorkflowTemplate = {
    id: generateId(),
    courseType,
    name: `${COURSE_TYPE_LABELS[courseType]}课中工作流`,
    isCustom: false,
    nodes: createDefaultNodes(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const templates = getWorkflowTemplates()
  templates.push(newTemplate)
  saveToStorage(WORKFLOW_TEMPLATES_KEY, templates)
  return newTemplate
}

export function createCustomWorkflowTemplate(
  name: string,
  courseType: ClassType
): WorkflowTemplate {
  const COURSE_TYPE_LABELS: Record<ClassType, string> = {
    GY: 'GY',
    KET: 'KET',
    PET: 'PET',
    FCE: 'FCE',
    CAE: 'CAE',
    CPE: 'CPE',
    OTHER: '其他',
  }

  const newTemplate: WorkflowTemplate = {
    id: generateId(),
    courseType,
    name,
    courseLabel: COURSE_TYPE_LABELS[courseType],
    isCustom: true,
    nodes: [...DEFAULT_WORKFLOW_NODES.map((type, index) => ({
      id: generateId(),
      type,
      enabled: true,
      order: index,
      nodeCategory: 'required' as const,
      countInTodo: true,
      isCustom: false,
    }))],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const templates = getWorkflowTemplates()
  templates.push(newTemplate)
  saveToStorage(WORKFLOW_TEMPLATES_KEY, templates)
  window.dispatchEvent(new Event('workflowChanged'))
  return newTemplate
}

export function isSystemTemplate(templateId: string): boolean {
  const templates = getWorkflowTemplates()
  const template = templates.find((t) => t.id === templateId)
  if (!template) return true
  if (template.isCustom === false) return true
  if (template.courseType !== 'OTHER' && !template.isCustom) return true
  return false
}

export function saveWorkflowTemplate(
  data: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt'>,
  templateId?: string
): WorkflowTemplate {
  const templates = getWorkflowTemplates()

  if (templateId) {
    const existingById = templates.findIndex((t) => t.id === templateId)
    if (existingById !== -1) {
      templates[existingById] = {
        ...templates[existingById],
        ...data,
        updatedAt: new Date(),
      }
      saveToStorage(WORKFLOW_TEMPLATES_KEY, templates)
      window.dispatchEvent(new Event('workflowChanged'))
      return templates[existingById]
    }
  }

  const existingIndex = templates.findIndex((t) => t.courseType === data.courseType && !t.isCustom)

  if (existingIndex !== -1) {
    templates[existingIndex] = {
      ...templates[existingIndex],
      ...data,
      updatedAt: new Date(),
    }
    saveToStorage(WORKFLOW_TEMPLATES_KEY, templates)
    window.dispatchEvent(new Event('workflowChanged'))
    return templates[existingIndex]
  }

  const newTemplate: WorkflowTemplate = {
    ...data,
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  templates.push(newTemplate)
  saveToStorage(WORKFLOW_TEMPLATES_KEY, templates)
  window.dispatchEvent(new Event('workflowChanged'))
  return newTemplate
}

export function updateWorkflowNode(
  templateId: string,
  nodeId: string,
  updates: Partial<Pick<WorkflowNode, 'enabled' | 'order' | 'customName' | 'customIcon' | 'description' | 'nodeCategory' | 'countInTodo'>>
): WorkflowTemplate | null {
  const templates = getWorkflowTemplates()
  const templateIndex = templates.findIndex((t) => t.id === templateId)
  if (templateIndex === -1) return null

  const nodeIndex = templates[templateIndex].nodes.findIndex((n) => n.id === nodeId)
  if (nodeIndex === -1) return null

  templates[templateIndex].nodes[nodeIndex] = {
    ...templates[templateIndex].nodes[nodeIndex],
    ...updates,
  }
  templates[templateIndex].updatedAt = new Date()
  saveToStorage(WORKFLOW_TEMPLATES_KEY, templates)
  window.dispatchEvent(new Event('workflowChanged'))
  return templates[templateIndex]
}

export function deleteWorkflowNode(templateId: string, nodeId: string): WorkflowTemplate | null {
  const templates = getWorkflowTemplates()
  const templateIndex = templates.findIndex((t) => t.id === templateId)
  if (templateIndex === -1) return null

  templates[templateIndex].nodes = templates[templateIndex].nodes
    .filter((n) => n.id !== nodeId)
    .map((n, i) => ({ ...n, order: i }))
  templates[templateIndex].updatedAt = new Date()
  saveToStorage(WORKFLOW_TEMPLATES_KEY, templates)
  window.dispatchEvent(new Event('workflowChanged'))
  return templates[templateIndex]
}

export function reorderWorkflowNodes(
  templateId: string,
  nodeIds: string[]
): WorkflowTemplate | null {
  const templates = getWorkflowTemplates()
  const templateIndex = templates.findIndex((t) => t.id === templateId)
  if (templateIndex === -1) return null

  const nodeMap = new Map(
    templates[templateIndex].nodes.map((n) => [n.id, n])
  )

  templates[templateIndex].nodes = nodeIds
    .map((id, index) => {
      const node = nodeMap.get(id)
      if (!node) return null
      return { ...node, order: index }
    })
    .filter((n): n is WorkflowNode => n !== null)

  templates[templateIndex].updatedAt = new Date()
  saveToStorage(WORKFLOW_TEMPLATES_KEY, templates)
  window.dispatchEvent(new Event('workflowChanged'))
  return templates[templateIndex]
}

export function resetWorkflowTemplate(templateId: string): WorkflowTemplate | null {
  const templates = getWorkflowTemplates()
  const templateIndex = templates.findIndex((t) => t.id === templateId)
  if (templateIndex === -1) return null

  templates[templateIndex].nodes = createDefaultNodes()
  templates[templateIndex].updatedAt = new Date()
  saveToStorage(WORKFLOW_TEMPLATES_KEY, templates)
  window.dispatchEvent(new Event('workflowChanged'))
  return templates[templateIndex]
}

export function deleteWorkflowTemplate(templateId: string): boolean {
  const templates = getWorkflowTemplates()
  const template = templates.find((t) => t.id === templateId)
  if (!template) return false
  if (template.isCustom === false) return false

  const filtered = templates.filter((t) => t.id !== templateId)
  if (filtered.length === templates.length) return false
  saveToStorage(WORKFLOW_TEMPLATES_KEY, filtered)
  window.dispatchEvent(new Event('workflowChanged'))
  return true
}

export function getAllCustomTemplates(): WorkflowTemplate[] {
  return getWorkflowTemplates().filter((t) => t.isCustom)
}

// 工作流待办事项管理
export function getWorkflowTodos(): WorkflowTodo[] {
  return getFromStorage<WorkflowTodo[]>(WORKFLOW_TODOS_KEY, [])
}

export function getWorkflowTodosByClass(classId: string, date?: string): WorkflowTodo[] {
  const todos = getWorkflowTodos()
  const dateStr = date || new Date().toISOString().split('T')[0]
  return todos.filter((t) => t.classId === classId && t.date === dateStr)
}

export function getWorkflowTodosByDate(date?: string): WorkflowTodo[] {
  const todos = getWorkflowTodos()
  const dateStr = date || new Date().toISOString().split('T')[0]
  return todos.filter((t) => t.date === dateStr)
}

export function generateWorkflowTodos(
  classId: string,
  className: string,
  courseType: ClassType,
  date?: string
): WorkflowTodo[] {
  const template = getWorkflowTemplateByCourseType(courseType)
  if (!template) return []

  const dateStr = date || new Date().toISOString().split('T')[0]
  const enabledNodes = template.nodes.filter((n) => n.enabled && n.countInTodo !== false)
  const validNodeIds = new Set(enabledNodes.map((n) => n.id))

  const allTodos = getWorkflowTodos()
  const classDateTodos = allTodos.filter(
    (t) => t.classId === classId && t.date === dateStr
  )
  const otherTodos = allTodos.filter(
    (t) => !(t.classId === classId && t.date === dateStr)
  )

  const cleanedClassDateTodos = classDateTodos.filter((t) => validNodeIds.has(t.nodeId || t.nodeType))

  const existingNodeIds = new Set(cleanedClassDateTodos.map((t) => t.nodeId || t.nodeType))

  const newTodos: WorkflowTodo[] = []

  enabledNodes.forEach((node) => {
      if (!existingNodeIds.has(node.id)) {
        const label = node.customName || WORKFLOW_NODE_LABELS[node.type] || node.type
        const newTodo: WorkflowTodo = {
          id: `${classId}:${node.id}`,
          classId,
          className,
          nodeType: node.type,
          nodeId: node.id,
          label,
          date: dateStr,
          completed: false,
        }
        newTodos.push(newTodo)
      }
    })

  const staleRemoved = cleanedClassDateTodos.length !== classDateTodos.length
  const finalTodos = [...otherTodos, ...cleanedClassDateTodos, ...newTodos]

  if (newTodos.length > 0 || staleRemoved) {
    saveToStorage(WORKFLOW_TODOS_KEY, finalTodos)
    window.dispatchEvent(new Event('classDataChanged'))
  }

  return [...cleanedClassDateTodos, ...newTodos]
}

export function toggleWorkflowTodo(todoId: string, classId?: string): WorkflowTodo | null {
  const todos = getWorkflowTodos()
  const index = todos.findIndex((t) => t.id === todoId)
  if (index === -1) return null
  if (classId && todos[index].classId !== classId) return null

  todos[index].completed = !todos[index].completed
  todos[index].completedAt = todos[index].completed
    ? new Date().toISOString()
    : undefined

  saveToStorage(WORKFLOW_TODOS_KEY, todos)
  window.dispatchEvent(new Event('classDataChanged'))
  return todos[index]
}

export function getWorkflowTodoStats(classId: string, date?: string): {
  total: number
  completed: number
  pending: number
} {
  const dateStr = date || new Date().toISOString().split('T')[0]
  const todos = getWorkflowTodos().filter(
    (t) => t.classId === classId && t.date === dateStr
  )
  const completed = todos.filter((t) => t.completed).length
  return {
    total: todos.length,
    completed,
    pending: todos.length - completed,
  }
}
