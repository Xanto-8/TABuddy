import type { AgentIntent, AgentParam, AgentAction, AgentResult, AgentSession, AgentStep, AgentCardData, AgentHandler, AgentStepField } from './types'
import { INTENT_LABELS } from './types'
import { handleCreateClass, handleSetClassType, handleAddStudentToClass } from './class-agent'
import { handleMarkKeyStudent, handleUnmarkKeyStudent, getKeyStudentsList } from './student-agent'
import { handleAddWorkflowTask, handleReorderWorkflowTasks, handleAddPhotoReminder } from './workflow-agent'
import { handleUpdateRetestList, handleUpdateQuizCompletion, handleAddQuizNotes, getRetestListByClass } from './quiz-agent'
import { getClasses, getStudents, getCurrentClassByTime, getCourseTasksByClassAndDate, getQuizRecordsByClass, getAllClassTypeOptions, addCustomClassType } from '@/lib/store'
import { getWorkflowTodoStats } from '@/lib/workflow-store'

interface IntentPattern {
  intent: AgentIntent
  patterns: RegExp[]
  extractParams: (match: RegExpMatchArray, input: string) => AgentParam
}

const INTENT_PATTERNS: IntentPattern[] = [
  // ===== 班级管理 =====
  {
    intent: 'create_class',
    patterns: [
      /(?:创建|新建|开设|开|新增)(?:一个|个|一门)?(?:新)?(?:的)?班级/i,
      /帮(?:我)?(?:创建|新建|开|搞)(?:一个|个)?班级/i,
      /我想(?:创建|新建|开)(?:一个|个)?班级/i,
      /(?:创建|新建|开设|开|新增).*?班级/i,
    ],
    extractParams: (match, input) => {
      const nameMatch = input.match(/(?:名称|名字|叫)[：:]\s*([^\s,，、。]+)/i)
      const typeMatch = input.match(/(?:类型|课程|班型)[：:]\s*([^\s,，、。]+)/i)
      const nameFromNamed = input.match(/名为\s*['"]?([^\s'""，,、。的]+)['"]?\s*(?:的|班级)/i)
      const nameFromCalled = input.match(/(?:叫做|称为|叫)\s*['"]?([^\s'""，,、。的]+)['"]?\s*(?:的|班级)/i)
      const nameFromCreate = input.match(/(?:创建|新建|开设|开|新增)(?:一个|个|一门)?(?:新)?(?:的)?班级[，,、\s]*([^\s，,。]+)/i)
      let className = nameMatch?.[1] || nameFromNamed?.[1] || nameFromCalled?.[1] || nameFromCreate?.[1] || undefined
      if (!className) {
        const fallback = input.match(/(?:创建|新建).*?班级\s*['"]?([^\s'""，,、。]{2,})['"]?/i)
        className = fallback?.[1]
      }
      let classType = typeMatch?.[1] || undefined
      if (!classType) {
        const typeKeywords = input.match(/\b(GY|KET|PET|FCE)\b/i)
        if (typeKeywords) {
          classType = typeKeywords[1].toUpperCase()
        }
      }
      const studentsMatch = input.match(/(?:学生|学员|成员)[：:]\s*(.+?)(?:$|[,，]|\s*(?:类型|课程|班型)[：:])/i)
      const students = studentsMatch?.[1]?.trim() || undefined
      return {
        className,
        classType,
        students,
      }
    },
  },
  {
    intent: 'set_class_type',
    patterns: [
      /(?:把|将)(.+?)(?:的)?(?:班级)?类型(?:设[为置成]|改为|改成|修改为|设置为)[：:]\s*([^\s,，、。]+)/i,
      /(?:设置|修改|更改)(.+?)(?:的)?(?:班级)?类型(?:为|成|至)[：:]\s*([^\s,，、。]+)/i,
      /(.+?)(?:的)?(?:班级)?类型(?:改成|改为|设定为|设置为)[：:]\s*([^\s,，、。]+)/i,
    ],
    extractParams: (match, input) => {
      const lastMatch = input.match(/(.+?)(?:的)?(?:班级)?类型(?:改成|改为|设定为|设置为|设[为置成])[：:]\s*([^\s,，、。]+)/i)
      return {
        className: lastMatch?.[1]?.trim() || match[1]?.trim(),
        classType: lastMatch?.[2]?.trim() || match[2]?.trim(),
      }
    },
  },
  {
    intent: 'add_student_to_class',
    patterns: [
      /(?:把|将)(.+?)(?:添加|加入|放到|安排到|分到)(.+?)(?:班级|班)/i,
      /(?:添加|加入|新增)(?:学生|学员)(.+?)(?:到|至|进)(.+?)(?:班级|班)/i,
      /(?:给|为)(.+?)(?:班级|班)(?:添加|加入|新增)(?:学生|学员)(.+?)/i,
    ],
    extractParams: (match, input) => {
      const parts = input.match(/(?:把|将)(.+?)(?:添加|加入|放到|安排到|分到)(.+?)(?:班级|班)/i)
      if (parts) {
        return { studentName: parts[1]?.trim(), className: parts[2]?.trim() }
      }
      const parts2 = input.match(/(?:添加|加入|新增)(?:学生|学员)(.+?)(?:到|至|进)(.+?)(?:班级|班)/i)
      if (parts2) {
        return { studentName: parts2[1]?.trim(), className: parts2[2]?.trim() }
      }
      const parts3 = input.match(/(?:给|为)(.+?)(?:班级|班)(?:添加|加入|新增)(?:学生|学员)(.+?)/i)
      if (parts3) {
        return { className: parts3[1]?.trim(), studentName: parts3[2]?.trim() }
      }
      return {}
    },
  },
  // ===== 工作流管理 =====
  {
    intent: 'add_workflow_task',
    patterns: [
      /(?:新增|添加|增加|新建)(?:一个|个)?(?:工作流)?任务(?:[：:，,、\s]*([^\s，,。]+))?$/i,
      /(?:帮|给|为)(.+?)(?:的)?(?:工作流)?(?:新增|添加|增加|新建)(?:一个|个)?任务(?:[：:，,、\s]*([^\s，,。]+))?$/i,
      /(?:新增|添加|增加)(?:一个|个)?(?:可选)?(?:的)?任务(?:[：:，,、\s]*([^\s，,。]+))?$/i,
    ],
    extractParams: (match, input) => {
      const taskMatch = input.match(/(?:任务)[：:，,、\s]*([^\s，,。]+)/i)
      const nameFromPattern = input.match(/(?:新增|添加|增加|新建)(?:一个|个)?(?:工作流)?任务[：:，,、\s]*([^\s，,。]+)/i)
      const withClass = input.match(/(?:帮|给|为)(.+?)(?:的)?(?:工作流)?(?:新增|添加|增加|新建)(?:一个|个)?任务/i)
      return {
        taskName: taskMatch?.[1] || nameFromPattern?.[1] || undefined,
        className: withClass?.[1]?.trim() || undefined,
      }
    },
  },
  {
    intent: 'reorder_workflow_tasks',
    patterns: [
      /(?:调整|修改|重新排|排序|重新排序)(?:工作流)?任务顺序/i,
      /(?:调整|修改|重新排|排序|重新排序)(.+?)(?:的)?(?:工作流)?任务顺序/i,
      /(?:把|将)(.+?)移到/i,
      /(?:把|将)(.+?)(?:和|与)(.+?)(?:交换|调换|互换)/i,
    ],
    extractParams: (match, input) => {
      const clsMatch = input.match(/(?:调整|修改|排序)(.+?)(?:的)?(?:工作流)?任务顺序/i)
      return { className: clsMatch?.[1]?.trim() || undefined }
    },
  },
  {
    intent: 'add_photo_reminder',
    patterns: [
      /(?:添加|增加|新增)(?:一个|个)?(?:可选)?(?:的)?拍照(?:提醒|任务)/i,
      /(?:加个|加一个)拍照(?:提醒|任务)/i,
      /(?:需要|要)拍照(?:提醒|记录)/i,
    ],
    extractParams: (match, input) => {
      const clsMatch = input.match(/(?:为|给|帮)(.+?)(?:班级|班)?(?:添加|增加|新增)/i)
      return { className: clsMatch?.[1]?.trim() || undefined }
    },
  },
  // ===== 学生标记 =====
  {
    intent: 'mark_key_student',
    patterns: [
      /(?:标记|将)(.+?)(?:标记[为成])?重点(?:关注)?(?:学生)?/i,
      /(?:把)(.+?)(?:标[记为成]为?)?重点(?:关注)?(?:学生)?/i,
      /(.+?)(?:需|需要)重点(?:关注|跟进)/i,
    ],
    extractParams: (match, input) => {
      const name = match[1]?.trim()
      const reasonMatch = input.match(/(?:原因是?|因为|由于)[：:，,\s]*([^\s,，。]+)/i)
      return {
        studentName: name,
        reason: reasonMatch?.[1]?.trim() || undefined,
      }
    },
  },
  {
    intent: 'unmark_key_student',
    patterns: [
      /(?:取消)(.+?)(?:的)?重点(?:关注)?(?:标记)?/i,
      /(?:把)(.+?)(?:的重点标记)?(?:移除|取消|去掉)/i,
      /(?:不再)(?:标记|关注)(.+?)/i,
    ],
    extractParams: (match, input) => ({
      studentName: match[1]?.trim(),
    }),
  },
  // ===== 小测&重测 =====
  {
    intent: 'update_retest_list',
    patterns: [
      /(?:录入|更新|修改|添加)(?:重测|补考)(?:名单|学生)/i,
      /(?:把)(.+?)(?:加入|放到?)(?:重测|补考)(?:名单)/i,
      /(.+?)(?:需?需要?)?(?:重测|补考)/i,
    ],
    extractParams: (match, input) => {
      const namesMatch = input.match(/(?:录入|更新|修改|添加)(?:重测|补考)(?:名单|学生)[：:，,、\s]*([^\s，,。]+(?:[,，、]\s*[^\s，,。]+)*)/i)
      const namesFromAdd = input.match(/(?:把)(.+?)(?:加入|放到?)(?:重测|补考)(?:名单)/i)
      const namesFromNeed = input.match(/(.+?)(?:需?需要?)?(?:重测|补考)/i)
      const nameStr = namesMatch?.[1] || namesFromAdd?.[1] || namesFromNeed?.[1] || ''
      const names = nameStr.split(/[,，、\s]+/).filter(Boolean)
      const clsMatch = input.match(/(.+?)(?:班级|班)/i)
      return {
        retestStudents: names.length > 0 ? names : undefined,
        className: clsMatch?.[1]?.trim() || undefined,
      }
    },
  },
  {
    intent: 'update_quiz_completion',
    patterns: [
      /(?:更新|修改)(.+?)(?:的)?小测(?:完成)?(?:情况|状态)/i,
      /(.+?)(?:的)?小测(?:完成)?(?:情况|状态)(?:是|为|:)：?\s*(已完成|完成|部分完成|部分|未完成|没完成|未做)/i,
      /(?:把)(.+?)(?:的)?小测(?:状态|情况)?(?:改成|改为|更新为)[：:]\s*(已完成|完成|部分完成|部分|未完成|没完成|未做)/i,
    ],
    extractParams: (match, input) => {
      const statusMatch = input.match(/(已完成|完成|部分完成|部分|未完成|没完成|未做)/i)
      const nameMatch = input.match(/(?:更新|修改|把)(.+?)(?:的)?小测/i)
      const clsMatch = input.match(/(.+?)(?:班级|班)/i)
      return {
        studentName: nameMatch?.[1]?.trim(),
        quizCompletion: statusMatch?.[1] || undefined,
        className: clsMatch?.[1]?.trim() || undefined,
      }
    },
  },
  {
    intent: 'add_quiz_notes',
    patterns: [
      /(?:备注|记录|添加备注|补充)(.+?)(?:的)?小测(?:表现|情况)/i,
      /小测(?:表现|情况|备注)[：:]\s*(.+?)$/i,
      /(?:为|给)(.+?)(?:班级|班)(?:的)?小测(?:备注|添加备注|记录)/i,
    ],
    extractParams: (match, input) => {
      const notesMatch = input.match(/(?:备注|记录|添加备注|补充)(?:.+?)?(?:的)?小测(?:表现|情况)[：:，,、\s]*([^\n]+)/i)
      const notesFromEnd = input.match(/小测(?:表现|情况|备注)[：:]\s*(.+?)$/i)
      const clsMatch = input.match(/(?:为|给)(.+?)(?:班级|班)/i)
      return {
        quizNotes: notesMatch?.[1]?.trim() || notesFromEnd?.[1]?.trim() || undefined,
        className: clsMatch?.[1]?.trim() || undefined,
      }
    },
  },
]

const QUESTION_PATTERNS = [
  /^(?:什么|怎么|为什么|是否|有没有|如何|需不需要|是不是|能不能)/i,
  /^(?:请问|我想问|问一下|打听|咨询|了解)/i,
  /^[?？]/,
  /(?:吗|呢|吧|呀|啊)\s*[?？]?\s*$/i,
  /^(?:查询|查看|看看|找|搜索|查一下|帮我查)/i,
  /^(?:现在该做什么|小测情况|重点关注学生|重测名单|学习中心网址|反馈模板)/i,
  /^(?:hello|hi|你好|您好|嗨|早上好|下午好|晚上好|谢谢|感谢)/i,
  /^[?？]\s*$/,
]

const GREETING_PATTERNS = [
  /^(?:hi|hello|你好|您好|嗨|早上好|下午好|晚上好|大家好|hey)\b/i,
  /^[?？]\s*$/i,
]

const CANCEL_PATTERNS = [
  /^(?:取消|退出|终止|停止|结束|算了|不做了|不要了)/i,
  /^(?:cancel|quit|exit|stop|abort)/i,
]

function isQuestion(text: string): boolean {
  return QUESTION_PATTERNS.some(p => p.test(text.trim()))
}

function isGreeting(text: string): boolean {
  return GREETING_PATTERNS.some(p => p.test(text.trim()))
}

function isCancel(text: string): boolean {
  return CANCEL_PATTERNS.some(p => p.test(text.trim()))
}

function classifyIntent(input: string): { intent: AgentIntent | null; params: AgentParam } {
  const trimmed = input.trim()
  for (const ip of INTENT_PATTERNS) {
    for (const pattern of ip.patterns) {
      const match = trimmed.match(pattern)
      if (match) {
        return {
          intent: ip.intent,
          params: ip.extractParams(match, trimmed),
        }
      }
    }
  }
  return { intent: null, params: {} }
}

const handlerMap: Record<AgentIntent, AgentHandler> = {
  create_class: handleCreateClass,
  set_class_type: handleSetClassType,
  add_student_to_class: handleAddStudentToClass,
  add_workflow_task: handleAddWorkflowTask,
  reorder_workflow_tasks: handleReorderWorkflowTasks,
  add_photo_reminder: handleAddPhotoReminder,
  mark_key_student: handleMarkKeyStudent,
  unmark_key_student: handleUnmarkKeyStudent,
  update_retest_list: handleUpdateRetestList,
  update_quiz_completion: handleUpdateQuizCompletion,
  add_quiz_notes: handleAddQuizNotes,
}

function buildGeneralResponse(input: string): AgentResult | null {
  const trimmed = input.trim()

  if (isGreeting(trimmed)) {
    const cls = getCurrentClassByTime()
    if (cls) {
      return {
        success: true,
        message: `你好！我是英语助教小T 👋\n你当前活跃班级是「${cls.name}（${cls.type}）」哦~\n可以向我提问或下达操作指令，比如「创建新班级」「标记张三为重点关注」「录入重测名单」等。`,
        syncTo: '',
      }
    }
    return {
      success: true,
      message: `你好！我是英语助教小T 👋\n当前暂未检测到上课班级，你可以：\n1. 问我通用教学问题\n2. 下达操作指令（如「创建新班级」「标记重点学生」）`,
      syncTo: '',
    }
  }

  if (/^(?:现在该做什么|现在要做什么|当前任务|今天做什么)/i.test(trimmed)) {
    const cls = getCurrentClassByTime()
    if (!cls) {
      return {
        success: true,
        message: '当前未检测到上课班级，暂无待办任务。你可以创建新班级或询问其他教学问题。',
        syncTo: '',
      }
    }
    const todayStr = new Date().toISOString().split('T')[0]
    const todayTasks = getCourseTasksByClassAndDate(cls.id, todayStr)
    const workflowStats = getWorkflowTodoStats(cls.id)
    if (todayTasks.length === 0 && workflowStats.total === 0) {
      return {
        success: true,
        message: `「${cls.name}」暂无今日任务，你可以通过工作流配置添加任务。`,
        syncTo: '',
      }
    }
    const taskList = todayTasks.map(t => `${t.completed ? '✅' : '⬜'} ${t.title || t.content}`).join('\n')
    return {
      success: true,
      message: `「${cls.name}」今日待办：\n${taskList}${workflowStats.total > 0 ? `\n\n工作流进度：${workflowStats.completed}/${workflowStats.total}` : ''}`,
      syncTo: '',
    }
  }

  if (/^(?:小测情况|小测怎么样|小测结果)/i.test(trimmed)) {
    const cls = getCurrentClassByTime()
    if (!cls) {
      return {
        success: true,
        message: '当前未检测到上课班级，无法获取小测情况。',
        syncTo: '',
      }
    }
    const todayStr = new Date().toISOString().split('T')[0]
    const todayRecords = getQuizRecordsByClass(cls.id)
      .filter(r => new Date(r.assessedAt).toISOString().split('T')[0] === todayStr)
    if (todayRecords.length === 0) {
      return {
        success: true,
        message: `「${cls.name}」今日暂无小测记录。`,
        syncTo: '',
      }
    }
    const students = getStudents()
    const summary = todayRecords.map(r => {
      const student = students.find(s => s.id === r.studentId)
      const statusMap: Record<string, string> = { completed: '✅已完成', partial: '🔸部分完成', not_done: '⬜未完成' }
      const scores = r.wordTotal ? ` (单词${r.wordScore}/${r.wordTotal})` : ''
      return `${student?.name || '未知'}: ${statusMap[r.completion] || r.completion}${scores}`
    }).join('\n')
    return {
      success: true,
      message: `「${cls.name}」今日小测情况：\n${summary}`,
      syncTo: '',
    }
  }

  if (/^(?:重点(?:关注)?学生|风险学生|需跟进)/i.test(trimmed)) {
    const keyStudents = getKeyStudentsList()
    if (keyStudents.length === 0) {
      return {
        success: true,
        message: '暂无手动标记的重点关注学生，你可通过「标记XX为重点关注」来添加。',
        syncTo: '',
      }
    }
    const list = keyStudents.filter((item): item is NonNullable<typeof item> => item !== null)
      .map((item, i) => {
        return `${i + 1}. ${item.student.name}${item.reason ? `（原因：${item.reason}）` : ''}`
      }).join('\n')
    return {
      success: true,
      message: `当前标记的重点关注学生：\n${list}`,
      syncTo: '',
    }
  }

  if (/^(?:重测(?:名单)?|补考(?:名单)?)/i.test(trimmed)) {
    const cls = getCurrentClassByTime()
    if (!cls) {
      return {
        success: true,
        message: '当前未检测到上课班级，请指定班级查询重测名单。',
        syncTo: '',
      }
    }
    const retestList = getRetestListByClass(cls.id)
    if (retestList.length === 0) {
      return {
        success: true,
        message: `「${cls.name}」今日暂无重测名单。`,
        syncTo: '',
      }
    }
    return {
      success: true,
      message: `「${cls.name}」今日重测名单：\n${retestList.map((e, i) => `${i + 1}. ${e.studentName}`).join('\n')}`,
      syncTo: '',
    }
  }

  if (/^(?:学习中心网址|网址|官网)/i.test(trimmed)) {
    return {
      success: true,
      message: '学习中心网址：https://learn.xdf.cn\n你也可以在浏览器中搜索「新东方学习中心」访问。',
      syncTo: '',
    }
  }

  if (/^(?:反馈模板|模板|反馈格式)/i.test(trimmed)) {
    return {
      success: true,
      message: '课程反馈模板格式：\n📚 课程内容：\n✅ 课堂表现：\n📝 作业情况：\n📊 小测结果：\n💡 改进建议：',
      syncTo: '',
    }
  }

  return null
}

// ===== Agent Session Management =====

let activeSession: AgentSession | null = null
let sessionCounter = 0

const STEP_DEFINITIONS: Record<AgentIntent, AgentStep[]> = {
  create_class: [
    {
      stepNumber: 1,
      totalSteps: 3,
      title: '设置班级名称',
      description: '请为班级起一个名称，例如「日T4」「KET周末班」',
      field: { key: 'className', label: '班级名称', type: 'text', placeholder: '请输入班级名称' },
    },
    {
      stepNumber: 2,
      totalSteps: 3,
      title: '选择班级类型',
      description: '请选择班级类型，该类型将作为班级标识使用',
      field: {
        key: 'classType', label: '班级类型', type: 'select',
        placeholder: '请选择班级类型',
        options: [
          { label: 'GY', value: 'GY' },
          { label: 'KET', value: 'KET' },
          { label: 'PET', value: 'PET' },
          { label: 'FCE', value: 'FCE' },
          { label: 'OTHER', value: 'OTHER' },
        ],
      },
    },
    {
      stepNumber: 3,
      totalSteps: 3,
      title: '添加班级学生',
      description: '可手动输入或批量粘贴学生名单，多个姓名用逗号或换行分隔',
      field: { key: 'students', label: '学生名单', type: 'students', placeholder: '输入学生姓名，多个用逗号或换行分隔' },
    },
  ],
  set_class_type: [],
  add_student_to_class: [
    {
      stepNumber: 1,
      totalSteps: 2,
      title: '输入学生姓名',
      description: '请输入要添加到班级的学生姓名',
      field: { key: 'studentName', label: '学生姓名', type: 'text', placeholder: '请输入学生姓名' },
    },
    {
      stepNumber: 2,
      totalSteps: 2,
      title: '选择目标班级',
      description: '请选择要将学生添加到哪个班级',
      field: {
        key: 'className', label: '目标班级', type: 'select',
        placeholder: '请选择班级',
        options: [],
      },
    },
  ],
  add_workflow_task: [
    {
      stepNumber: 1,
      totalSteps: 4,
      title: '填写任务名称',
      description: '请输入要添加的工作流任务名称',
      field: { key: 'taskForm_name', label: '任务名称', type: 'task_form' },
    },
    {
      stepNumber: 2,
      totalSteps: 4,
      title: '选择任务阶段',
      description: '请选择该任务所属的教学阶段',
      field: { key: 'taskForm_stage', label: '所属阶段', type: 'task_form' },
    },
    {
      stepNumber: 3,
      totalSteps: 4,
      title: '调整任务顺序',
      description: '调整任务在当前课程工作流中的插入位置',
      field: { key: 'taskForm_position', label: '任务位置', type: 'task_form' },
    },
    {
      stepNumber: 4,
      totalSteps: 4,
      title: '确认并提交',
      description: '配置任务属性并确认添加',
      field: { key: 'taskForm_attributes', label: '任务属性', type: 'task_form' },
    },
  ],
  reorder_workflow_tasks: [],
  add_photo_reminder: [],
  mark_key_student: [
    {
      stepNumber: 1,
      totalSteps: 2,
      title: '输入学生姓名',
      description: '请输入要标记为重点关注的学生姓名',
      field: { key: 'studentName', label: '学生姓名', type: 'text', placeholder: '请输入学生姓名' },
    },
    {
      stepNumber: 2,
      totalSteps: 2,
      title: '标记原因（可选）',
      description: '请输入标记此学生的原因，例如「作业不认真」「小测不及格」',
      field: { key: 'reason', label: '标记原因', type: 'text', placeholder: '请输入原因（可选，可跳过）' },
    },
  ],
  unmark_key_student: [],
  update_retest_list: [],
  update_quiz_completion: [],
  add_quiz_notes: [],
}

function getClassOptions(): { label: string; value: string }[] {
  const classes = getClasses()
  return classes.map(c => ({ label: `${c.name}（${c.type || ''}）`, value: c.name }))
}

function enrichStepOptions(step: AgentStep): AgentStep {
  if (step.field.type === 'select' && step.field.key === 'classType') {
    const allOptions = getAllClassTypeOptions()
    return {
      ...step,
      field: { ...step.field, options: allOptions },
    }
  }
  if (step.field.type === 'select' && !step.field.options?.length) {
    return {
      ...step,
      field: { ...step.field, options: getClassOptions() },
    }
  }
  return step
}

function buildCardData(session: AgentSession, step: AgentStep): AgentCardData {
  const enrichedStep = enrichStepOptions(step)
  return {
    sessionId: session.id,
    title: enrichedStep.title,
    description: enrichedStep.description || '',
    step: enrichedStep.stepNumber,
    totalSteps: enrichedStep.totalSteps,
    field: enrichedStep.field,
    collected: session.collected,
    isLastStep: enrichedStep.stepNumber >= enrichedStep.totalSteps,
  }
}

function startSession(intent: AgentIntent, params: AgentParam): { session: AgentSession; result: AgentResult } {
  sessionCounter++
  const steps = STEP_DEFINITIONS[intent].map(s => enrichStepOptions(s))
  const collected: Record<string, string> = {}

  if (params.className) collected.className = params.className
  if (params.classType) collected.classType = params.classType
  if (params.students) collected.students = params.students
  if (params.studentName) collected.studentName = params.studentName
  if (params.reason) collected.reason = params.reason
  if (params.taskName) collected.taskName = params.taskName
  if (params.taskStage) collected.taskStage = params.taskStage
  if (params.taskPosition !== undefined) collected.taskPosition = String(params.taskPosition)
  if (params.requirePhoto !== undefined) collected.requirePhoto = String(params.requirePhoto)
  if (params.isRequiredTask !== undefined) collected.isRequiredTask = String(params.isRequiredTask)

  const session: AgentSession = {
    id: `session_${sessionCounter}_${Date.now()}`,
    intent,
    intentLabel: INTENT_LABELS[intent],
    params,
    steps,
    currentStep: 0,
    collected,
    createdAt: Date.now(),
    cancelled: false,
    completed: false,
  }

  activeSession = session

  const stepIndex = findFirstIncompleteStep(session)
  session.currentStep = stepIndex

  if (stepIndex >= steps.length) {
    const execResult = finalizeSession()
    return {
      session,
      result: {
        ...execResult,
        sessionId: session.id,
      },
    }
  }

  const step = steps[stepIndex]

  const activeClass = getCurrentClassByTime()
  const message = intent === 'add_workflow_task' && activeClass
    ? `🔔 已进入Agent任务创建模式，将为【${activeClass.name}（${activeClass.type}）】添加仅本次课程生效的临时任务。`
    : `🔔 已进入Agent操作模式，我会引导你完成「${session.intentLabel}」并同步到对应板块`

  return {
    session,
    result: {
      success: true,
      message,
      syncTo: '',
      isAgentMode: true,
      sessionId: session.id,
      cardData: buildCardData(session, step),
    },
  }
}

function findFirstIncompleteStep(session: AgentSession): number {
  for (let i = 0; i < session.steps.length; i++) {
    const step = session.steps[i]
    if (!session.collected[step.field.key]) {
      return i
    }
  }
  return session.steps.length
}

function tryCollectFromInput(input: string, session: AgentSession): string[] {
  const collectedKeys: string[] = []
  const step = session.steps[session.currentStep]
  if (!step) return collectedKeys

  const value = input.trim()
  if (!value || value.length === 0) return collectedKeys

  if (step.field.type === 'task_form') {
    try {
      const parsed = JSON.parse(value)
      if (parsed.taskName) session.collected.taskName = parsed.taskName
      if (parsed.taskStage) session.collected.taskStage = parsed.taskStage
      if (parsed.taskPosition !== undefined) session.collected.taskPosition = String(parsed.taskPosition)
      if (parsed.requirePhoto !== undefined) session.collected.requirePhoto = String(!!parsed.requirePhoto)
      if (parsed.isRequiredTask !== undefined) session.collected.isRequiredTask = String(!!parsed.isRequiredTask)
      if (parsed.className) session.collected.className = parsed.className
      session.collected[step.field.key] = 'done'
      collectedKeys.push(step.field.key)
    } catch {
      session.collected[step.field.key] = value
      collectedKeys.push(step.field.key)
    }
  } else if (step.field.key === 'students') {
    session.collected[step.field.key] = value
    collectedKeys.push(step.field.key)
  } else if (step.field.key === 'classType') {
    const allOptions = getAllClassTypeOptions()
    const matchedOption = allOptions.find(
      o => o.value.toUpperCase() === value.toUpperCase() || o.label.toUpperCase() === value.toUpperCase()
    )
    if (matchedOption) {
      session.collected[step.field.key] = matchedOption.value
      collectedKeys.push(step.field.key)
    } else {
      const customType = value.trim().toUpperCase()
      if (customType) {
        addCustomClassType(customType)
        session.collected[step.field.key] = customType
        collectedKeys.push(step.field.key)
      }
    }
  } else {
    session.collected[step.field.key] = value
    collectedKeys.push(step.field.key)
  }

  return collectedKeys
}

function executeHandler(session: AgentSession): AgentResult {
  const params: AgentParam = {
    className: session.collected.className || session.params.className,
    classType: session.collected.classType || session.params.classType,
    students: session.collected.students || session.params.students,
    studentName: session.collected.studentName || session.params.studentName,
    reason: session.collected.reason || session.params.reason,
    taskName: session.collected.taskName || session.params.taskName,
    taskStage: session.collected.taskStage || session.params.taskStage,
    taskPosition: session.collected.taskPosition ? parseInt(session.collected.taskPosition) : session.params.taskPosition,
    requirePhoto: session.collected.requirePhoto === 'true' || !!session.params.requirePhoto,
    isRequiredTask: session.collected.isRequiredTask === 'true' || !!session.params.isRequiredTask,
    studentId: session.params.studentId,
    classId: session.params.classId,
  }

  const action: AgentAction = {
    intent: session.intent,
    params,
    rawInput: '',
  }

  const handler = handlerMap[session.intent]
  if (!handler) {
    return { success: false, message: `无法处理操作：${session.intentLabel}`, syncTo: '' }
  }

  return handler(action)
}

export function processAgentInput(input: string): AgentResult {
  const trimmed = input.trim()
  if (!trimmed) {
    return { success: false, message: '请告诉我你需要什么帮助？', syncTo: '' }
  }

  if (activeSession && !activeSession.completed && !activeSession.cancelled) {
    return processAgentStep(trimmed)
  }

  if (isCancel(trimmed)) {
    if (activeSession) {
      return cancelAgentSession()
    }
    return { success: true, message: '好的，已退出操作模式。有什么我可以帮你的吗？', syncTo: '' }
  }

  const generalResponse = buildGeneralResponse(trimmed)
  if (generalResponse) {
    return generalResponse
  }

  const { intent, params } = classifyIntent(trimmed)

  if (!intent) {
    return {
      success: false,
      message: '未识别到操作指令，请问你是否需要：\n1. 创建/管理班级\n2. 管理工作流任务\n3. 标记重点关注学生\n4. 录入重测名单\n5. 更新小测情况\n\n或者你也可以直接提问。',
      syncTo: '',
      needMoreInfo: true,
    }
  }

  const steps = STEP_DEFINITIONS[intent]
  if (!steps || steps.length === 0) {
    const handler = handlerMap[intent]
    if (!handler) {
      return { success: false, message: '暂时不支持该操作，请稍后再试', syncTo: '' }
    }

    const action: AgentAction = { intent, params, rawInput: trimmed }
    return handler(action)
  }

  const { result } = startSession(intent, params)
  return result
}

function processAgentStep(input: string): AgentResult {
  if (!activeSession) {
    return { success: false, message: '没有活跃的Agent会话，请重新发起操作。', syncTo: '' }
  }

  if (isCancel(input)) {
    return cancelAgentSession()
  }

  const currentStepIndex = activeSession.currentStep
  const steps = activeSession.steps

  if (currentStepIndex >= steps.length) {
    return finalizeSession()
  }

  const isOptional = activeSession.steps[currentStepIndex]?.field.key === 'reason'

  if (input.trim().length > 0 || isOptional) {
    const collected = tryCollectFromInput(input, activeSession)
    if (collected.length === 0 && !isOptional) {
      const step = steps[currentStepIndex]
      return {
        success: false,
        message: `请填写${step.field.label}`,
        syncTo: '',
        isAgentMode: true,
        sessionId: activeSession.id,
        cardData: buildCardData(activeSession, step),
      }
    }
  }

  const nextStepIndex = findFirstIncompleteStep(activeSession)

  if (nextStepIndex >= steps.length) {
    return finalizeSession()
  }

  const collectedFields = Object.keys(activeSession.collected)
  const lastCollectedKey = collectedFields[collectedFields.length - 1]
  const lastCollectedValue = lastCollectedKey ? activeSession.collected[lastCollectedKey] : ''

  activeSession.currentStep = nextStepIndex
  const nextStep = steps[nextStepIndex]

  return {
    success: true,
    message: `✅ 已记录信息：${lastCollectedValue}，下一步请填写：${nextStep.field.label}`,
    syncTo: '',
    isAgentMode: true,
    sessionId: activeSession.id,
    cardData: buildCardData(activeSession, nextStep),
  }
}

function finalizeSession(): AgentResult {
  if (!activeSession) {
    return { success: false, message: '没有活跃的Agent会话。', syncTo: '' }
  }

  const result = executeHandler(activeSession)

  if (result.success) {
    const intentLabel = activeSession.intentLabel
    const summaryFields = Object.entries(activeSession.collected)
      .filter(([key]) => key !== 'reason')
      .map(([key, value]) => `${key === 'className' ? '班级名称' : key === 'classType' ? '班级类型' : key === 'students' ? '学生名单' : key === 'studentName' ? '学生姓名' : key === 'taskName' ? '任务名称' : key === 'reason' ? '原因' : key}: ${value}`)
      .join('、')

    activeSession.completed = true
    activeSession = null

    return {
      ...result,
      message: `${result.message}\n\n已完成${intentLabel}，信息如下：${summaryFields}，已同步到${result.syncTo}板块，后续可在${result.syncTo}中查看和编辑`,
      isAgentMode: true,
    }
  }

  activeSession.completed = true
  activeSession = null

  return {
    ...result,
    isAgentMode: true,
  }
}

export function cancelAgentSession(): AgentResult {
  if (!activeSession) {
    return { success: true, message: '当前没有活跃的Agent会话。', syncTo: '' }
  }

  const intentLabel = activeSession.intentLabel
  activeSession.cancelled = true
  activeSession = null

  return {
    success: true,
    message: `已取消${intentLabel}操作，临时数据已清空，未执行任何同步。有什么其他需要吗？`,
    syncTo: '',
  }
}

export function getActiveSession(): AgentSession | null {
  return activeSession
}

export function isOperationIntent(input: string): boolean {
  const trimmed = input.trim()
  if (isQuestion(trimmed)) return false
  const { intent } = classifyIntent(trimmed)
  if (intent) return true
  const operationKeywords = ['创建', '新建', '添加', '修改', '设置', '编辑', '删除', '加入', '更新', '录入', '新增', '开设', '取消']
  if (operationKeywords.some(k => trimmed.includes(k))) return true
  const knownQuestions = [
    '现在该做什么', '现在要做什么', '当前任务', '今天做什么',
    '小测情况', '小测怎么样', '小测结果',
    '重点关注学生', '风险学生', '需跟进',
    '重测名单', '补考名单',
    '学习中心网址', '网址', '官网',
    '反馈模板', '模板', '反馈格式',
  ]
  return knownQuestions.some(q => trimmed.startsWith(q))
}
