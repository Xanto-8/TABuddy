'use client'

import * as XLSX from 'xlsx'
import { getStudentsByClass, getHomeworkAssessmentsByClass } from '@/lib/store'
import { completionLabels } from '@/lib/constants'

export function exportHomeworkScores(classId: string, className: string): void {
  const students = getStudentsByClass(classId)
  const assessments = getHomeworkAssessmentsByClass(classId)

  const studentAssessmentMap = new Map<string, typeof assessments>()
  students.forEach((s) => {
    studentAssessmentMap.set(s.id, [])
  })
  assessments.forEach((a) => {
    const list = studentAssessmentMap.get(a.studentId)
    if (list) list.push(a)
  })

  const rows: Record<string, string | number>[] = students.map((student) => {
    const studentAssessments = studentAssessmentMap.get(student.id) || []
    const sorted = [...studentAssessments].sort(
      (a, b) => new Date(b.assessedAt).getTime() - new Date(a.assessedAt).getTime()
    )
    const latest = sorted[0]
    const total = studentAssessments.length
    const completed = studentAssessments.filter((a) => a.completion === 'completed').length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      '学生姓名': student.name,
      '提交次数': total,
      '最近完成度': latest ? completionLabels[latest.completion] : '-',
      '最近正确率': latest ? `${latest.accuracy}%` : '-',
      '完成率': `${completionRate}%`,
      '备注': student.notes || '',
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '作业成绩')

  const safeName = className.replace(/[\\/:*?"<>|]/g, '_')
  XLSX.writeFile(workbook, `${safeName}_作业成绩.xlsx`)
}
