'use client'

import type { KnowledgeEntry } from './knowledge-base-store'

export interface PublicKnowledgeEntry extends KnowledgeEntry {
  enabled: boolean
}

const DEFAULTS: PublicKnowledgeEntry[] = [
  {
    id: 'pub_add_task',
    keywords: ['添加任务', '新增任务', '创建任务', '任务', '工作流任务'],
    title: '添加任务操作指引',
    content: '✅ 您可以按以下方式添加任务：\n1. 在「我的工作流」页面中点击「添加任务」按钮\n2. 或直接向助教发送指令，格式如：「添加新任务：课堂小测」\n3. 任务类型包括：课堂小测、作业批改、拍照提醒、重点关注等',
    type: 'info',
    priority: 5,
    enabled: true,
  },
  {
    id: 'pub_create_class',
    keywords: ['创建班级', '开设班级', '新班级', '新建班级', '添加班级'],
    title: '创建班级操作指引',
    content: '✅ 创建班级流程：\n1. 向助教发送「创建新班级」指令\n2. 按提示设置班级名称（如：日T4）\n3. 选择班级类型（GY/KET/PET/FCE/OTHER）\n4. 添加学生名单（支持一行一个或逗号分隔）\n5. 确认后自动完成创建',
    type: 'document',
    priority: 5,
    enabled: true,
  },
  {
    id: 'pub_switch_mode',
    keywords: ['切换模式', '深色模式', '浅色模式', '暗色模式', '亮色模式', '主题切换', '夜间模式'],
    title: '深色/浅色模式切换',
    content: '✅ 您可以通过以下方式切换显示模式：\n1. 向助教发送「切换深色模式」或「切换浅色模式」\n2. 点击侧边栏底部的主题切换按钮\n3. 系统会根据时间自动切换（6:00-18:00 浅色，其余时间深色）',
    type: 'info',
    priority: 4,
    enabled: true,
  },
  {
    id: 'pub_workflow_guide',
    keywords: ['工作流', '流程', '工作流程', '工作流管理', '任务流程'],
    title: '工作流使用指南',
    content: '📋 工作流管理功能：\n1. 每个班级可配置独立的工作流模板\n2. 工作流包含一系列有序任务\n3. 支持调整任务顺序、标记完成状态\n4. 课程进行中会自动显示当前任务\n5. 可在「我的工作流」页面查看和管理',
    type: 'document',
    priority: 4,
    enabled: true,
  },
  {
    id: 'pub_student_management',
    keywords: ['学生管理', '重点学生', '重点关注', '标记学生', '取消标记', '学生名单'],
    title: '学生管理操作指引',
    content: '👨‍🎓 学生管理操作：\n1. 标记重点学生：向助教发送「标记张三为重点关注」\n2. 取消重点标记：向助教发送「取消李四的重点标记」\n3. 查看学生信息可在「班级管理」页面操作\n4. 重点学生在仪表盘会高亮显示',
    type: 'info',
    priority: 4,
    enabled: true,
  },
  {
    id: 'pub_quiz_guide',
    keywords: ['小测', '随堂测验', '测验', '测试', '随堂测试', '重测', '补考'],
    title: '随堂测验管理说明',
    content: '📊 随堂测验管理：\n1. 在「随堂测验」页面可查看和管理小测记录\n2. 支持录入小测成绩和评估各维度得分\n3. 可标记需重测学生并生成重测名单\n4. 向助教发送指令直达：「录入张三的小测数据」\n5. 重测名单更新：「更新重测名单」',
    type: 'document',
    priority: 3,
    enabled: true,
  },
  {
    id: 'pub_homework_guide',
    keywords: ['作业', '批改作业', '作业批改', '作业评估', '作业评价', '作业管理'],
    title: '作业评估标准说明',
    content: '📝 作业评估包含三个维度：\n1. 完成度：是否按时提交并完成全部内容\n2. 准确率：知识掌握程度的量化指标\n3. 书写质量：规范性和整洁度的综合评定\n可在「作业管理」页面查看所有作业记录',
    type: 'document',
    priority: 3,
    enabled: true,
  },
  {
    id: 'pub_feedback_template',
    keywords: ['反馈', '反馈模板', '课程反馈', '家长反馈', '沟通反馈', '反馈格式'],
    title: '课程反馈与沟通模板',
    content: '【课程反馈模板】\n📚 课程内容：今日进度 + 核心知识点\n✅ 课堂表现：学生互动 + 纪律情况\n📝 作业情况：完成率 + 准确率 + 书写评价\n📊 小测结果：完成情况 + 各维度得分\n💡 改进建议：针对性建议\n可在「反馈管理」页面查看和导出',
    type: 'template',
    priority: 3,
    enabled: true,
  },
  {
    id: 'pub_learning_center',
    keywords: ['学习中心', '官网', '网址', 'xdf', 'learn.xdf.cn', '学习平台'],
    title: '新东方学习中心',
    content: '新东方学习中心是学生在线学习平台，可查看课程、完成作业、参与小测等。\n访问地址：https://learn.xdf.cn\n建议使用 Chrome 或 Edge 浏览器访问',
    type: 'link',
    url: 'https://learn.xdf.cn',
    priority: 4,
    enabled: true,
  },
  {
    id: 'pub_attendance_guide',
    keywords: ['考勤', '签到', '出勤', '点名', '未到', '请假', '考勤记录'],
    title: '考勤签到操作指南',
    content: '✅ 考勤记录可通过以下方式操作：\n1. 在排课表中右击时间段可标记考勤\n2. 考勤状态包括：出勤、请假、缺勤\n3. 请假需提前在系统提交申请\n4. 出勤率将影响学生综合评定',
    type: 'info',
    priority: 3,
    enabled: true,
  },
  {
    id: 'pub_retest_guide',
    keywords: ['重测', '补考', '重测名单', '补考名单', '重测管理'],
    title: '重测管理操作说明',
    content: '📋 重测名单管理：\n1. 在小测管理中可标记需重测的学生\n2. 重测名单会同步显示在小测概览\n3. 完成重测后需更新小测记录状态\n4. 重测成绩同样计入学习档案\n5. 向助教发送「录入重测名单」快速操作',
    type: 'info',
    priority: 2,
    enabled: true,
  },
  {
    id: 'pub_class_type_guide',
    keywords: ['班级类型', 'GY', 'KET', 'PET', 'FCE', '设置类型', '类型设置'],
    title: '班级类型设置说明',
    content: '✅ 班级类型说明：\n- GY：国际课程\n- KET：剑桥初级英语考试\n- PET：剑桥中级英语考试\n- FCE：剑桥中高级英语考试\n- CAE：剑桥高级英语考试\n- CPE：剑桥精通级英语考试\n- OTHER：其他类型\n向助教发送「设置XX班类型为GY」快速修改',
    type: 'info',
    priority: 2,
    enabled: true,
  },
  {
    id: 'pub_photo_reminder',
    keywords: ['拍照', '拍照提醒', '课堂拍照', '照片', '拍摄', '提醒'],
    title: '拍照提醒功能说明',
    content: '📸 拍照提醒功能：\n1. 可在工作流中设置拍照提醒任务\n2. 设置后系统会提示您在课堂中拍照\n3. 照片将关联到对应的课程记录\n4. 向助教发送「添加拍照提醒」快速设置',
    type: 'info',
    priority: 2,
    enabled: true,
  },
  {
    id: 'pub_help_feedback',
    keywords: ['帮助', '反馈', '帮助与反馈', '使用帮助', '问题反馈', '帮助中心'],
    title: '帮助与反馈使用指引',
    content: '💬 帮助与反馈：\n1. 可在「帮助与反馈」页面查看完整使用文档\n2. 如遇问题可向助教咨询\n3. 功能建议和问题反馈可通过系统提交\n4. 紧急问题请联系客服处理',
    type: 'info',
    priority: 1,
    enabled: true,
  },
]

let cachedEntries: PublicKnowledgeEntry[] = [...DEFAULTS]

function broadcastChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('publicKnowledgeBaseChanged'))
  }
}

export async function loadPublicKnowledgeBase(): Promise<void> {
  try {
    const res = await fetch('/api/public-knowledge')
    if (res.ok) {
      const data: PublicKnowledgeEntry[] = await res.json()
      cachedEntries = data
      broadcastChange()
    }
  } catch {
  }
}

export function getPublicKnowledgeBase(): PublicKnowledgeEntry[] {
  return cachedEntries
}

export function getPublicEntry(id: string): PublicKnowledgeEntry | undefined {
  return cachedEntries.find(e => e.id === id)
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}

async function syncToServer() {
  try {
    await fetch('/api/public-knowledge', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: cachedEntries }),
    })
  } catch {
  }
}

export function savePublicEntry(entry: PublicKnowledgeEntry): void {
  const index = cachedEntries.findIndex(e => e.id === entry.id)
  if (index >= 0) {
    cachedEntries[index] = entry
  } else {
    cachedEntries.push(entry)
  }
  broadcastChange()
  syncToServer()
}

export function createPublicEntry(data: Omit<PublicKnowledgeEntry, 'id'>): PublicKnowledgeEntry {
  const entry: PublicKnowledgeEntry = { ...data, id: generateId() }
  cachedEntries.push(entry)
  broadcastChange()
  syncToServer()
  return entry
}

export function deletePublicEntry(id: string): void {
  cachedEntries = cachedEntries.filter(e => e.id !== id)
  broadcastChange()
  syncToServer()
}

export function togglePublicEntry(id: string): void {
  const entry = cachedEntries.find(e => e.id === id)
  if (entry) {
    entry.enabled = !entry.enabled
    broadcastChange()
    syncToServer()
  }
}

export function resetPublicKnowledgeBase(): void {
  cachedEntries = DEFAULTS.map(e => ({ ...e }))
  broadcastChange()
  syncToServer()
}

export function matchPublicKnowledgeBase(query: string): PublicKnowledgeEntry | null {
  const lower = query.toLowerCase()
  const entries = cachedEntries.filter(e => e.enabled)
  const scored = entries
    .map(entry => {
      const matchCount = entry.keywords.filter(kw => lower.includes(kw.toLowerCase())).length
      return { entry, score: matchCount * entry.priority }
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
  return scored.length > 0 ? scored[0].entry : null
}
