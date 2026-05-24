'use client'

import { getStudentsByClass, saveStudent } from '@/lib/store'

export interface ImportResult {
  success: number
  skipped: number
  errors: string[]
}

export function importStudentsFromRows(
  rows: { name: string; notes?: string }[],
  classId: string
): ImportResult {
  const result: ImportResult = { success: 0, skipped: 0, errors: [] }
  const existingStudents = getStudentsByClass(classId)
  const existingNames = new Set(
    existingStudents.map((s) => s.name.trim().toLowerCase())
  )

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowLabel = `第 ${i + 1} 行`

    if (!row.name || !row.name.trim()) {
      result.errors.push(`${rowLabel}: 姓名为空，已跳过`)
      result.skipped++
      continue
    }

    const trimmedName = row.name.trim()

    if (existingNames.has(trimmedName.toLowerCase())) {
      result.errors.push(`${rowLabel}: "${trimmedName}" 已存在于班级中，已跳过`)
      result.skipped++
      continue
    }

    try {
      saveStudent({
        name: trimmedName,
        class: existingStudents[0]?.class || 'OTHER',
        classId,
        notes: row.notes?.trim() || undefined,
      })
      existingNames.add(trimmedName.toLowerCase())
      result.success++
    } catch (e) {
      result.errors.push(`${rowLabel}: "${trimmedName}" 导入失败`)
      result.skipped++
    }
  }

  return result
}
