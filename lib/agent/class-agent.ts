import type { AgentAction, AgentResult } from './types'
import {
  getClasses,
  saveClass,
  updateClass,
  addStudentToClass as storeAddStudent,
  getStudents,
  saveStudent,
  addCustomClassType,
} from '@/lib/store'
import type { ClassType } from '@/types'

const CLASS_TYPE_LABELS: Record<string, string> = {
  GY: 'GY',
  KET: 'KET',
  PET: 'PET',
  FCE: 'FCE',
  CAE: 'CAE',
  CPE: 'CPE',
  OTHER: 'OTHER',
}

const LABEL_TO_TYPE: Record<string, string> = {
  gy: 'GY',
  ket: 'KET',
  pet: 'PET',
  fce: 'FCE',
  cae: 'CAE',
  cpe: 'CPE',
  other: 'OTHER',
}

function normalizeClassType(type: string): string | undefined {
  const upper = type.toUpperCase().trim()
  if (upper in CLASS_TYPE_LABELS) {
    return upper
  }
  const lower = type.toLowerCase().trim()
  if (lower in LABEL_TO_TYPE) {
    return LABEL_TO_TYPE[lower]
  }
  return undefined
}

function parseStudentNames(input: string): string[] {
  const names = input
    .split(/[,，、\s]+/)
    .map(s => s.trim())
    .filter(Boolean)
  return Array.from(new Set(names))
}

function handleCreateClass(action: AgentAction): AgentResult {
  const { className, classType, students } = action.params

  if (!className) {
    return {
      success: false,
      message: '请提供班级名称，例如：创建班级「日T4」',
      syncTo: '',
      needMoreInfo: true,
      followUpQuestion: '请问班级名称是什么？',
    }
  }

  const classes = getClasses()
  const existing = classes.find(
    (c) => c.name.toLowerCase() === className.toLowerCase()
  )
  if (existing) {
    return {
      success: false,
      message: `⚠️ 班级「${className}」已存在，请使用其他名称。如需修改班级信息，可以使用编辑功能。`,
      syncTo: '班级管理',
    }
  }

  let finalClassType: string = 'OTHER'
  if (classType) {
    const normalized = normalizeClassType(classType)
    if (normalized) {
      finalClassType = normalized
    } else {
      finalClassType = classType.trim().toUpperCase()
      addCustomClassType(finalClassType)
    }
  }

  const newClass = saveClass({
    name: className,
    type: finalClassType as ClassType,
  })

  let importedCount = 0
  const importedNames: string[] = []
  if (students) {
    const studentNames = parseStudentNames(students)
    const allStudents = getStudents()

    for (const name of studentNames) {
      const existingStudent = allStudents.find(
        (s) => s.name.toLowerCase() === name.toLowerCase()
      )

      if (existingStudent) {
        if (existingStudent.class !== className) {
          storeAddStudent(existingStudent.id, newClass.id, newClass.name)
          importedCount++
          importedNames.push(name)
        }
      } else {
        const newStudent = {
          name,
          class: newClass.name,
          classId: newClass.id,
          classType: newClass.type,
        }
        saveStudent(newStudent)
        importedCount++
        importedNames.push(name)
      }
    }

    updateClass(newClass.id, { studentCount: importedCount })
  }

  const studentMsg = importedCount > 0
    ? `，并导入了 ${importedCount} 名学生（${importedNames.join('、')}）`
    : ''

  return {
    success: true,
    message: `✅ 班级【${className}（${finalClassType}）】已创建成功${studentMsg}，已同步到班级管理板块`,
    syncTo: '班级管理',
    data: { className, classType: finalClassType, students: importedCount },
  }
}

function handleSetClassType(action: AgentAction): AgentResult {
  const { className, classType } = action.params

  if (!className) {
    return {
      success: false,
      message: '请指定要设置类型的班级名称，例如：设置高一1班类型为GY',
      syncTo: '',
      needMoreInfo: true,
      followUpQuestion: '请问要设置哪个班级？',
    }
  }

  if (!classType) {
    return {
      success: false,
      message: '请提供班级类型（GY/KET/PET/FCE/OTHER）',
      syncTo: '',
      needMoreInfo: true,
      followUpQuestion: '请问班级类型是什么？',
    }
  }

  const classes = getClasses()
  const cls = classes.find(
    (c) => c.name.toLowerCase() === className.toLowerCase()
  )
  if (!cls) {
    return {
      success: false,
      message: `⚠️ 未找到班级「${className}」，请先确认班级名称是否正确。`,
      syncTo: '',
    }
  }

  let normalizedType: string = classType
  const std = normalizeClassType(classType)
  if (std) {
    normalizedType = std
  } else {
    normalizedType = classType.trim().toUpperCase()
    addCustomClassType(normalizedType)
  }

  updateClass(cls.id, { type: normalizedType as ClassType })

  return {
    success: true,
    message: `✅ 班级「${className}」类型已更新为【${normalizedType}】，已同步到班级管理板块`,
    syncTo: '班级管理',
    data: { className, classType: normalizedType },
  }
}

function handleAddStudentToClass(action: AgentAction): AgentResult {
  const { studentName, className } = action.params

  if (!studentName) {
    return {
      success: false,
      message: '请提供学生姓名',
      syncTo: '',
      needMoreInfo: true,
    }
  }

  if (!className) {
    return {
      success: false,
      message: '请指定目标班级',
      syncTo: '',
      needMoreInfo: true,
    }
  }

  const classes = getClasses()
  const cls = classes.find(
    (c) => c.name.toLowerCase() === className.toLowerCase()
  )
  if (!cls) {
    return {
      success: false,
      message: `⚠️ 未找到班级「${className}」`,
      syncTo: '',
    }
  }

  const students = getStudents()
  let student = students.find(
    (s) => s.name.toLowerCase() === studentName.toLowerCase()
  )

  if (!student) {
    const newStudent = {
      name: studentName,
      class: cls.name,
      classId: cls.id,
      classType: cls.type,
    }
    saveStudent(newStudent)
    return {
      success: true,
      message: `✅ 已创建新生「${studentName}」并加入班级「${className}」，已同步到班级学生管理板块`,
      syncTo: '班级学生管理',
    }
  }

  if (student.class === cls.name) {
    return {
      success: true,
      message: `✅ 学生「${studentName}」已在班级「${className}」中`,
      syncTo: '班级学生管理',
    }
  }

  storeAddStudent(student.id, cls.id, cls.name)

  return {
    success: true,
    message: `✅ 学生「${studentName}」已加入班级「${className}」，已同步到班级学生管理板块`,
    syncTo: '班级学生管理',
  }
}

export { handleCreateClass, handleSetClassType, handleAddStudentToClass }
export { CLASS_TYPE_LABELS, LABEL_TO_TYPE, normalizeClassType }
