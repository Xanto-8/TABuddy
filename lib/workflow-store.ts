import { WorkflowTemplate, WorkflowTodo, WorkflowNode, WorkflowNodeType, ClassType, DEFAULT_WORKFLOW_NODES, WORKFLOW_NODE_LABELS, WORKFLOW_NODE_ICONS } from '@/types'
import { getCache, isCacheLoaded, triggerSync } from './store'

const DEFAULT_WORKFLOW_TEMPLATES: Record<string, { name: string; nodes: Omit<WorkflowNode, 'id'>[] }> = {
  GY: {
    name: '高中英语标准流程',
    nodes: DEFAULT_WORKFLOW_NODES.map((type, i) => ({
      type: type as WorkflowNodeType,
      enabled: true,
      order: i,
      nodeCategory: 'required' as const,
    })),
  },
  KET: {
    name: 'KET标准流程',
    nodes: DEFAULT_WORKFLOW_NODES.map((type, i) => ({
      type: type as WorkflowNodeType,
      enabled: true,
      order: i,
      nodeCategory: 'required' as const,
    })),
  },
  PET: {
    name: 'PET标准流程',
    nodes: DEFAULT_WORKFLOW_NODES.map((type, i) => ({
      type: type as WorkflowNodeType,
      enabled: true,
      order: i,
      nodeCategory: 'required' as const,
    })),
  },
}

DEFAULT_WORKFLOW_TEMPLATES.FCE = { ...DEFAULT_WORKFLOW_TEMPLATES.GY, name: 'FCE标准流程' }
DEFAULT_WORKFLOW_TEMPLATES.CAE = { ...DEFAULT_WORKFLOW_TEMPLATES.GY, name: 'CAE标准流程' }
DEFAULT_WORKFLOW_TEMPLATES.CPE = { ...DEFAULT_WORKFLOW_TEMPLATES.GY, name: 'CPE标准流程' }
DEFAULT_WORKFLOW_TEMPLATES.OTHER = { ...DEFAULT_WORKFLOW_TEMPLATES.GY, name: '默认流程' }

let localTemplates: WorkflowTemplate[] = []
let localTodos: WorkflowTodo[] = []

function getLocalWorkflowTemplates(): WorkflowTemplate[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem('tabuddy_workflow_templates')
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

function saveLocalWorkflowTemplates(templates: WorkflowTemplate[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('tabuddy_workflow_templates', JSON.stringify(templates))
  } catch { }
}

function getLocalWorkflowTodos(): WorkflowTodo[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem('tabuddy_workflow_todos')
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

function saveLocalWorkflowTodos(todos: WorkflowTodo[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('tabuddy_workflow_todos', JSON.stringify(todos))
  } catch { }
}

export function getWorkflowTemplates(): WorkflowTemplate[] {
  if (isCacheLoaded()) {
    return getCache().workflowTemplates
  }
  const local = getLocalWorkflowTemplates()
  localTemplates = local
  return local
}

export function getOrCreateWorkflowTemplate(courseType: string): WorkflowTemplate {
  const templates = getWorkflowTemplates()
  let template = templates.find(t => t.courseType === courseType)
  if (!template) {
    const defaults = DEFAULT_WORKFLOW_TEMPLATES[courseType] || DEFAULT_WORKFLOW_TEMPLATES.GY
    const now = new Date()
    template = {
      id: `wt-${Date.now()}`,
      courseType: courseType as ClassType,
      name: defaults.name,
      nodes: defaults.nodes.map((n, i) => ({ ...n, id: `wn-${Date.now()}-${i}` })),
      createdAt: now,
      updatedAt: now,
    }
    saveWorkflowTemplate(template)
  }
  return template
}

export function getWorkflowTemplateByCourseType(courseType: string): WorkflowTemplate | undefined {
  return getWorkflowTemplates().find(t => t.courseType === courseType)
}

export function saveWorkflowTemplate(template: Partial<WorkflowTemplate> & { courseType: string; name: string; nodes: WorkflowNode[] }, id?: string): WorkflowTemplate {
  const now = new Date()
  const fullTemplate: WorkflowTemplate = {
    id: id || template.id || `wt-${Date.now()}`,
    courseType: template.courseType as ClassType,
    name: template.name,
    nodes: template.nodes,
    createdAt: template.createdAt || now,
    updatedAt: now,
  }
  if (isCacheLoaded()) {
    const cache = getCache()
    const existing = cache.workflowTemplates.findIndex(t => t.id === fullTemplate.id)
    if (existing !== -1) {
      cache.workflowTemplates[existing] = fullTemplate
    } else {
      cache.workflowTemplates.push(fullTemplate)
    }
    triggerSync()
  } else {
    const existing = localTemplates.findIndex(t => t.id === fullTemplate.id)
    if (existing !== -1) {
      localTemplates[existing] = fullTemplate
    } else {
      localTemplates.push(fullTemplate)
    }
    saveLocalWorkflowTemplates(localTemplates)
  }
  return fullTemplate
}

export function deleteWorkflowTemplate(id: string): void {
  if (isCacheLoaded()) {
    const cache = getCache()
    const index = cache.workflowTemplates.findIndex(t => t.id === id)
    if (index !== -1) {
      cache.workflowTemplates.splice(index, 1)
      triggerSync()
    }
  } else {
    const index = localTemplates.findIndex(t => t.id === id)
    if (index !== -1) {
      localTemplates.splice(index, 1)
      saveLocalWorkflowTemplates(localTemplates)
    }
  }
}

export function resetWorkflowTemplate(id: string): WorkflowTemplate | undefined {
  const templates = getWorkflowTemplates()
  const template = templates.find(t => t.id === id)
  if (!template) return undefined
  const defaults = DEFAULT_WORKFLOW_TEMPLATES[template.courseType] || DEFAULT_WORKFLOW_TEMPLATES.GY
  const reset: WorkflowTemplate = {
    ...template,
    name: defaults.name,
    nodes: defaults.nodes.map((n, i) => ({ ...n, id: `wn-${Date.now()}-${i}` })),
    updatedAt: new Date(),
  }
  saveWorkflowTemplate(reset)
  return reset
}

export function updateWorkflowNode(templateId: string, nodeId: string, updates: Partial<WorkflowNode>): WorkflowTemplate | undefined {
  const templates = getWorkflowTemplates()
  const template = templates.find(t => t.id === templateId)
  if (!template) return undefined
  const nodeIndex = template.nodes.findIndex(n => n.id === nodeId)
  if (nodeIndex === -1) return undefined
  template.nodes[nodeIndex] = { ...template.nodes[nodeIndex], ...updates }
  saveWorkflowTemplate(template)
  return template
}

export function deleteWorkflowNode(templateId: string, nodeId: string): WorkflowTemplate | undefined {
  const templates = getWorkflowTemplates()
  const template = templates.find(t => t.id === templateId)
  if (!template) return undefined
  template.nodes = template.nodes.filter(n => n.id !== nodeId)
  saveWorkflowTemplate(template)
  return template
}

export function reorderWorkflowNodes(templateId: string, nodeIds: string[]): WorkflowTemplate | undefined {
  const templates = getWorkflowTemplates()
  const template = templates.find(t => t.id === templateId)
  if (!template) return undefined
  const nodeMap = new Map(template.nodes.map(n => [n.id, n]))
  template.nodes = nodeIds.map((id, i) => {
    const node = nodeMap.get(id)
    if (node) return { ...node, order: i }
    return null
  }).filter((n): n is WorkflowNode => n !== null)
  saveWorkflowTemplate(template)
  return template
}

export function getWorkflowTodos(): WorkflowTodo[] {
  if (isCacheLoaded()) {
    return getCache().workflowTodos
  }
  const local = getLocalWorkflowTodos()
  localTodos = local
  return local
}

export function getWorkflowTodosByClass(classId: string, date: string): WorkflowTodo[] {
  return getWorkflowTodos().filter(t => t.classId === classId && t.date === date)
}

export function generateWorkflowTodos(classId: string, className: string, classType: string, date: string): WorkflowTodo[] {
  const template = getOrCreateWorkflowTemplate(classType)
  const existingTodos = getWorkflowTodosByClass(classId, date)
  if (existingTodos.length > 0) return existingTodos
  const todos: WorkflowTodo[] = template.nodes
    .filter(n => n.enabled)
    .sort((a, b) => a.order - b.order)
    .map((node, i) => ({
      id: `wtodo-${Date.now()}-${i}`,
      classId,
      className,
      date,
      nodeType: node.type,
      nodeId: node.id,
      label: node.customName || WORKFLOW_NODE_LABELS[node.type] || node.type,
      completed: false,
    }))
  todos.forEach(t => saveWorkflowTodo(t))
  return todos
}

export function saveWorkflowTodo(todo: WorkflowTodo): void {
  if (isCacheLoaded()) {
    getCache().workflowTodos.push(todo)
    triggerSync()
  } else {
    localTodos.push(todo)
    saveLocalWorkflowTodos(localTodos)
  }
}

export function updateWorkflowTodo(updated: WorkflowTodo): void {
  if (isCacheLoaded()) {
    const todos = getCache().workflowTodos
    const index = todos.findIndex(t => t.id === updated.id)
    if (index !== -1) {
      todos[index] = updated
      triggerSync()
    }
  } else {
    const index = localTodos.findIndex(t => t.id === updated.id)
    if (index !== -1) {
      localTodos[index] = updated
      saveLocalWorkflowTodos(localTodos)
    }
  }
}

export function toggleWorkflowTodo(todoId: string): WorkflowTodo | undefined {
  const todos = getWorkflowTodos()
  const todo = todos.find(t => t.id === todoId)
  if (!todo) return undefined
  todo.completed = !todo.completed
  todo.completedAt = todo.completed ? new Date().toISOString() : undefined
  if (isCacheLoaded()) {
    updateWorkflowTodo(todo)
  } else {
    const index = localTodos.findIndex(t => t.id === todoId)
    if (index !== -1) {
      localTodos[index] = todo
      saveLocalWorkflowTodos(localTodos)
    }
  }
  return todo
}

export function deleteWorkflowTodo(id: string): void {
  if (isCacheLoaded()) {
    const todos = getCache().workflowTodos
    const index = todos.findIndex(t => t.id === id)
    if (index !== -1) {
      todos.splice(index, 1)
      triggerSync()
    }
  } else {
    const index = localTodos.findIndex(t => t.id === id)
    if (index !== -1) {
      localTodos.splice(index, 1)
      saveLocalWorkflowTodos(localTodos)
    }
  }
}

export function getWorkflowTodoStats(classId: string, date?: string): { total: number; completed: number; pending: number } {
  let todos = getWorkflowTodos().filter(t => t.classId === classId)
  if (date) {
    todos = todos.filter(t => t.date === date)
  }
  const total = todos.length
  const completed = todos.filter(t => t.completed).length
  const pending = total - completed
  return { total, completed, pending }
}

export function getAllCustomTemplates(): WorkflowTemplate[] {
  return getWorkflowTemplates()
}

export function createCustomWorkflowTemplate(name: string, courseType: ClassType): WorkflowTemplate {
  const defaults = DEFAULT_WORKFLOW_TEMPLATES[courseType] || DEFAULT_WORKFLOW_TEMPLATES.GY
  const now = new Date()
  const template: WorkflowTemplate = {
    id: `wt-${Date.now()}`,
    courseType,
    name,
    nodes: defaults.nodes.map((n, i) => ({ ...n, id: `wn-${Date.now()}-${i}` })),
    createdAt: now,
    updatedAt: now,
    isCustom: true,
  }
  saveWorkflowTemplate(template)
  return template
}
