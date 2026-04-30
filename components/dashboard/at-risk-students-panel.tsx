'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Star, Users } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getClasses, getStudentsByClass, getQuizRecords } from '@/lib/store'
import type { Student, QuizRecord, Class } from '@/types'

interface StudentRiskInfo {
  student: Student
  className: string
  classId: string
  wordAccuracy: number | null
  grammarAccuracy: number | null
  hasWordIssue: boolean
  hasGrammarIssue: boolean
  tagType: 'word' | 'grammar' | 'both'
  tagLabel: string
}

function getLatestAccuracy(
  records: QuizRecord[],
  scoreKey: 'wordScore' | 'grammarScore',
  totalKey: 'wordTotal' | 'grammarTotal'
): number | null {
  const latest = records
    .filter(r => r[scoreKey] != null && r[totalKey] != null && (r[totalKey] as number) > 0)
    .sort((a, b) => new Date(b.assessedAt).getTime() - new Date(a.assessedAt).getTime())[0]
  if (!latest) return null
  return Math.round(((latest[scoreKey] as number) / (latest[totalKey] as number)) * 100)
}

export function AtRiskStudentsPanel() {
  const [mounted, setMounted] = useState(false)

  const refresh = useCallback(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setMounted(true)
    const handler = () => setMounted(k => !k)
    window.addEventListener('classDataChanged', handler)
    return () => window.removeEventListener('classDataChanged', handler)
  }, [])

  const riskData = useMemo(() => {
    if (!mounted) return []
    const classes = getClasses()
    const allQuizRecords = getQuizRecords()
    const result: StudentRiskInfo[] = []

    for (const cls of classes) {
      const students = getStudentsByClass(cls.id)
      const classRecords = allQuizRecords.filter(r => r.classId === cls.id)

      for (const student of students) {
        const studentRecords = classRecords.filter(r => r.studentId === student.id)

        if (studentRecords.length === 0) continue

        const wordAccuracy = getLatestAccuracy(studentRecords, 'wordScore', 'wordTotal')
        const grammarAccuracy = getLatestAccuracy(studentRecords, 'grammarScore', 'grammarTotal')

        const hasWordIssue = wordAccuracy !== null && wordAccuracy < 80
        const hasGrammarIssue = grammarAccuracy !== null && grammarAccuracy < 80

        if (!hasWordIssue && !hasGrammarIssue) continue

        let tagType: 'word' | 'grammar' | 'both'
        let tagLabel: string
        if (hasWordIssue && hasGrammarIssue) {
          tagType = 'both'
          tagLabel = '单词+语法需跟进'
        } else if (hasWordIssue) {
          tagType = 'word'
          tagLabel = '单词需跟进'
        } else {
          tagType = 'grammar'
          tagLabel = '语法需关注'
        }

        result.push({
          student,
          className: cls.name,
          classId: cls.id,
          wordAccuracy,
          grammarAccuracy,
          hasWordIssue,
          hasGrammarIssue,
          tagType,
          tagLabel,
        })
      }
    }

    result.sort((a, b) => {
      const aPriority = a.hasWordIssue && a.hasGrammarIssue ? 0 : 1
      const bPriority = b.hasWordIssue && b.hasGrammarIssue ? 0 : 1
      if (aPriority !== bPriority) return aPriority - bPriority
      const aMin = Math.min(a.wordAccuracy ?? 100, a.grammarAccuracy ?? 100)
      const bMin = Math.min(b.wordAccuracy ?? 100, b.grammarAccuracy ?? 100)
      return aMin - bMin
    })

    return result
  }, [mounted])

  const tagStyles = {
    word: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    grammar: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    both: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/20">
          <Star className="h-5 w-5 text-rose-600" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-sm">重点学生关注面板</h3>
          <p className="text-[11px] text-muted-foreground">需要特别关注的学生</p>
        </div>
      </div>

      {riskData.length > 0 ? (
        <div className="space-y-2">
          {riskData.map((item, index) => (
            <Link
              key={item.student.id}
              href="/quizzes"
              className="block"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.3 }}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {item.student.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.student.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {item.className}
                  </p>
                </div>
                <span className={cn(
                  'text-[10px] font-medium px-2 py-1 rounded-md shrink-0 border',
                  tagStyles[item.tagType]
                )}>
                  {item.tagLabel}
                </span>
              </motion.div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="p-3 rounded-full bg-muted mb-3">
            <Users className="h-6 w-6 text-muted-foreground/60" />
          </div>
          <p className="text-sm text-muted-foreground">
            暂无重点关注学生，继续加油！
          </p>
        </div>
      )}
    </div>
  )
}
