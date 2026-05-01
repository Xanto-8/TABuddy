'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Plus, Users, BookOpen, Trash2, Pencil, Search, UserPlus, GraduationCap, ClipboardList, BarChart3, Archive, ExternalLink, Link as LinkIcon, Clock, Calendar, Upload, ChevronDown, Download } from 'lucide-react'
import ResourcesTab from '@/components/lms/resources-tab'
import Link from 'next/link'
import { Class, Student, ClassType, ClassSchedule } from '@/types'
import { getClasses, getStudentsByClass, deleteStudent, getClassTypeLabel, getClassTypeColor, getStudents, getClassSchedules, saveClassSchedule, updateClassSchedule, deleteClassSchedule } from '@/lib/store'
import { cn } from '@/lib/utils'
import { PageContainer } from '@/components/ui/page-container'
import { useAuth } from '@/lib/auth-store'
import { useRoleAccess } from '@/lib/use-role-access'

export default function ClassDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { isClassAdmin } = useRoleAccess()
  const canEdit = isClassAdmin || user?.role === 'superadmin'
  const [cls, setCls] = useState<Class | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [showCreateStudentModal, setShowCreateStudentModal] = useState(false)
  const [showImportStudentsModal, setShowImportStudentsModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'students' | 'records' | 'resources' | 'schedule'>('students')

  useEffect(() => {
    const classId = params.id as string
    const classes = getClasses()
    const found = classes.find((c) => c.id === classId)
    if (found) {
      setCls(found)
      setStudents(getStudentsByClass(classId))
    }
  }, [params.id])

  const refreshStudents = () => {
    const classId = params.id as string
    setStudents(getStudentsByClass(classId))
    const classes = getClasses()
    const found = classes.find((c) => c.id === classId)
    if (found) setCls(found)
  }



  if (!cls) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">班级未找到</h3>
          <p className="text-muted-foreground mb-6">该班级不存在或已被删除</p>
          <Link
            href="/classes"
            className="inline-flex items-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回班级列表
          </Link>
        </div>
      </div>
    )
  }

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center flex-wrap gap-3 justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/classes')}
            className="p-2 rounded-lg hover:bg-accent hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-foreground">{cls.name}</h1>
              <span className={cn('px-2.5 py-0.5 rounded text-xs font-medium', getClassTypeColor(cls.type))}>
                {getClassTypeLabel(cls.type)}
              </span>
            </div>
            <p className="text-muted-foreground mt-1">
              <Users className="h-4 w-4 inline mr-1" />
              {cls.studentCount} 名学生
              {cls.description && <span className="ml-3">· {cls.description}</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-border">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <button
            onClick={() => setActiveTab('students')}
            className={cn(
              'pb-3 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap',
              activeTab === 'students'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-primary/30'
            )}
          >
            <Users className="h-4 w-4 inline mr-1.5" />
            班级学生
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={cn(
              'pb-3 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap',
              activeTab === 'records'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-primary/30'
            )}
          >
            <BarChart3 className="h-4 w-4 inline mr-1.5" />
            数据记录
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={cn(
              'pb-3 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap',
              activeTab === 'resources'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-primary/30'
            )}
          >
            <Archive className="h-4 w-4 inline mr-1.5" />
            仓库
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={cn(
              'pb-3 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap',
              activeTab === 'schedule'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-primary/30'
            )}
          >
            <Clock className="h-4 w-4 inline mr-1.5" />
            上课时间
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="w-full"
        >
          {activeTab === 'students' ? (
            <>
              <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="搜索学生姓名..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  />
                </div>
                <div className="flex items-center flex-wrap gap-2">
                  {canEdit && (
                    <button
                      onClick={() => setShowImportStudentsModal(true)}
                      className="inline-flex items-center px-4 py-2.5 rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors text-sm font-medium whitespace-nowrap"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      导入学生
                    </button>
                  )}
                  {canEdit && (
                    <button
                      onClick={() => setShowAddStudentModal(true)}
                      className="inline-flex items-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium whitespace-nowrap"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      添加学生
                    </button>
                  )}
                </div>
              </div>

              {filteredStudents.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-16"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <GraduationCap className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {searchQuery ? '没有找到匹配的学生' : '班级中还没有学生'}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery ? '试试其他搜索关键词' : '点击上方按钮添加学生到班级'}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => setShowAddStudentModal(true)}
                      className="inline-flex items-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      添加学生
                    </button>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap">姓名</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap">班级类型</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap">联系方式</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap">备注</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredStudents.map((student, index) => (
                        <motion.tr
                          key={student.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.03 }}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                  {student.name.charAt(0)}
                                </span>
                              </div>
                              <span className="text-sm font-medium text-foreground">{student.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('px-2 py-0.5 rounded text-xs font-medium', getClassTypeColor(student.class))}>
                              {getClassTypeLabel(student.class)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-muted-foreground">
                              {student.email && <div>{student.email}</div>}
                              {student.phone && <div>{student.phone}</div>}
                              {!student.email && !student.phone && <span className="text-xs">-</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-muted-foreground">
                              {student.notes || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {canEdit && (
                              <button
                                onClick={() => {
                                  if (confirm(`确定将 ${student.name} 从班级中移除？`)) {
                                    deleteStudent(student.id)
                                    refreshStudents()
                                  }
                                }}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </motion.div>
              )}

              {showAddStudentModal && (
                <AddStudentModal
                  classId={cls.id}
                  classType={cls.type}
                  onClose={() => setShowAddStudentModal(false)}
                  onAdded={() => {
                    setShowAddStudentModal(false)
                    refreshStudents()
                  }}
                  onCreateNew={() => {
                    setShowAddStudentModal(false)
                    setShowCreateStudentModal(true)
                  }}
                />
              )}

              {showCreateStudentModal && (
                <CreateStudentModal
                  classId={cls.id}
                  classType={cls.type}
                  onClose={() => setShowCreateStudentModal(false)}
                  onCreated={() => {
                    setShowCreateStudentModal(false)
                    refreshStudents()
                  }}
                />
              )}

              {showImportStudentsModal && (
                <ImportStudentsModal
                  classId={cls.id}
                  classType={cls.type}
                  onClose={() => setShowImportStudentsModal(false)}
                  onImported={() => {
                    setShowImportStudentsModal(false)
                    refreshStudents()
                  }}
                />
              )}
            </>
          ) : activeTab === 'resources' ? (
            <ResourcesTab classId={cls.id} />
          ) : activeTab === 'schedule' ? (
            <ScheduleTab classId={cls.id} canEdit={canEdit} />
          ) : (
            <RecordsTab classId={cls.id} students={students} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
    </PageContainer>
  )
}

function ScheduleTab({ classId, canEdit }: { classId: string; canEdit: boolean }) {
  const [schedules, setSchedules] = useState<ClassSchedule[]>([])
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ClassSchedule | null>(null)

  const refreshSchedules = () => {
    setSchedules(getClassSchedules(classId))
  }

  useEffect(() => {
    refreshSchedules()
  }, [classId])

  const getDayOfWeekLabel = (day: number): string => {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return days[day] || `星期${day}`
  }

  const handleDeleteSchedule = (id: string) => {
    if (confirm('确定要删除这个上课时间吗？')) {
      deleteClassSchedule(id)
      refreshSchedules()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">班级上课时间</h3>
            <p className="text-sm text-muted-foreground mt-1">
              设置班级的上课时间，系统会根据时间自动显示当前上课班级
            </p>
          </div>
          {canEdit && (
            <button
              onClick={() => setShowAddScheduleModal(true)}
              className="inline-flex items-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium whitespace-nowrap"
            >
              <Plus className="h-4 w-4 mr-2" />
              添加上课时间
            </button>
          )}
        </div>

      {schedules.length === 0 ? (
        <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">暂无上课时间设置</h3>
            <p className="text-muted-foreground mb-6">
              点击上方按钮添加班级的上课时间，系统会根据时间自动显示当前上课班级
            </p>
            {canEdit && (
              <button
                onClick={() => setShowAddScheduleModal(true)}
                className="inline-flex items-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium whitespace-nowrap"
              >
                <Plus className="h-4 w-4 mr-2" />
                添加上课时间
              </button>
            )}
          </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap">星期</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap">上课时间</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap">下课时间</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-foreground">
                      {getDayOfWeekLabel(schedule.dayOfWeek)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted-foreground">{schedule.startTime}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted-foreground">{schedule.endTime}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canEdit && (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setEditingSchedule(schedule)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {showAddScheduleModal && (
        <AddScheduleModal
          classId={classId}
          onClose={() => setShowAddScheduleModal(false)}
          onSaved={() => {
            setShowAddScheduleModal(false)
            refreshSchedules()
          }}
        />
      )}

      {editingSchedule && (
        <EditScheduleModal
          schedule={editingSchedule}
          onClose={() => setEditingSchedule(null)}
          onSaved={() => {
            setEditingSchedule(null)
            refreshSchedules()
          }}
        />
      )}
    </div>
  )
}

function AddStudentModal({
  classId,
  classType,
  onClose,
  onAdded,
  onCreateNew,
}: {
  classId: string
  classType: ClassType
  onClose: () => void
  onAdded: () => void
  onCreateNew: () => void
}) {
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    const { getStudents } = require('@/lib/store')
    const students = getStudents() as Student[]
    setAllStudents(students.filter((s: Student) => !s.classId || s.classId === classId))
  }, [classId])

  const availableStudents = allStudents.filter(
    (s) =>
      (!s.classId || s.classId === classId) &&
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleStudent = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  const handleAdd = async () => {
    if (selectedIds.size === 0) return
    setAdding(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    const { updateStudent } = require('@/lib/store')
    selectedIds.forEach((id) => {
      updateStudent(id, { classId })
    })
    setAdding(false)
    onAdded()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-xl border border-border shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">添加学生到班级</h2>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            新建学生
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索学生..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {availableStudents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-3">没有找到可添加的学生</p>
              <button
                onClick={onCreateNew}
                className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                新建学生
              </button>
            </div>
          ) : (
            availableStudents.map((student) => (
              <button
                key={student.id}
                onClick={() => toggleStudent(student.id)}
                className={cn(
                  'flex items-center w-full px-3 py-2.5 rounded-lg text-sm transition-colors',
                  selectedIds.has(student.id)
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-accent text-foreground'
                )}
              >
                <div
                  className={cn(
                    'w-4 h-4 rounded border-2 mr-3 flex items-center justify-center transition-colors',
                    selectedIds.has(student.id)
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground'
                  )}
                >
                  {selectedIds.has(student.id) && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mr-2.5">
                  <span className="text-xs font-medium text-primary">{student.name.charAt(0)}</span>
                </div>
                <span className="font-medium">{student.name}</span>
                {student.classId === classId && (
                  <span className="ml-2 text-xs text-muted-foreground">(已在班级中)</span>
                )}
              </button>
            ))
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
          <span className="text-sm text-muted-foreground">
            已选择 {selectedIds.size} 名学生
          </span>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleAdd}
              disabled={selectedIds.size === 0 || adding}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
            >
              {adding ? '添加中...' : `添加 (${selectedIds.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AddScheduleModal({
  classId,
  onClose,
  onSaved,
}: {
  classId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:30')
  const [saving, setSaving] = useState(false)
  const [isDaySelectOpen, setIsDaySelectOpen] = useState(false)
  const [isStartHourOpen, setIsStartHourOpen] = useState(false)
  const [isStartMinuteOpen, setIsStartMinuteOpen] = useState(false)
  const [isEndHourOpen, setIsEndHourOpen] = useState(false)
  const [isEndMinuteOpen, setIsEndMinuteOpen] = useState(false)
  const daySelectRef = useRef<HTMLDivElement>(null)
  const startHourRef = useRef<HTMLDivElement>(null)
  const startMinuteRef = useRef<HTMLDivElement>(null)
  const endHourRef = useRef<HTMLDivElement>(null)
  const endMinuteRef = useRef<HTMLDivElement>(null)

  const daysOfWeek = [
    { value: 0, label: '周日' },
    { value: 1, label: '周一' },
    { value: 2, label: '周二' },
    { value: 3, label: '周三' },
    { value: 4, label: '周四' },
    { value: 5, label: '周五' },
    { value: 6, label: '周六' },
  ]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (daySelectRef.current && !daySelectRef.current.contains(event.target as Node)) setIsDaySelectOpen(false)
      if (startHourRef.current && !startHourRef.current.contains(event.target as Node)) setIsStartHourOpen(false)
      if (startMinuteRef.current && !startMinuteRef.current.contains(event.target as Node)) setIsStartMinuteOpen(false)
      if (endHourRef.current && !endHourRef.current.contains(event.target as Node)) setIsEndHourOpen(false)
      if (endMinuteRef.current && !endMinuteRef.current.contains(event.target as Node)) setIsEndMinuteOpen(false)
    }
    if (isDaySelectOpen || isStartHourOpen || isStartMinuteOpen || isEndHourOpen || isEndMinuteOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => { document.removeEventListener('mousedown', handleClickOutside) }
  }, [isDaySelectOpen, isStartHourOpen, isStartMinuteOpen, isEndHourOpen, isEndMinuteOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    saveClassSchedule({ classId, dayOfWeek, startTime, endTime })
    setSaving(false)
    onSaved()
  }

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
  const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-xl border border-border shadow-2xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">添加上课时间</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              星期 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-7 gap-2">
              {daysOfWeek.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => setDayOfWeek(day.value)}
                  className={`py-2 rounded-lg border border-border text-sm transition-all ${
                    dayOfWeek === day.value
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-background text-foreground hover:bg-accent/50 hover:border-primary/30'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                上课时间 <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-1">
                <div className="relative flex-1" ref={startHourRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDaySelectOpen(false); setIsStartMinuteOpen(false); setIsEndHourOpen(false); setIsEndMinuteOpen(false); setIsStartHourOpen(!isStartHourOpen)
                    }}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm flex items-center justify-between cursor-pointer hover:bg-accent/50"
                  >
                    <span>{startTime.split(':')[0]}</span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isStartHourOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isStartHourOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-50">
                      <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-2xl overflow-hidden">
                        <div className="max-h-48 overflow-y-auto">
                          {hours.map((hour) => (
                            <button key={hour} type="button" onClick={() => { setStartTime(`${hour}:${startTime.split(':')[1]}`); setIsStartHourOpen(false) }}
                              className={`w-full px-4 py-2 text-left text-sm transition-all hover:bg-accent ${startTime.split(':')[0] === hour ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}>
                              {hour}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-muted-foreground font-medium">:</span>
                <div className="relative flex-1" ref={startMinuteRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDaySelectOpen(false); setIsStartHourOpen(false); setIsEndHourOpen(false); setIsEndMinuteOpen(false); setIsStartMinuteOpen(!isStartMinuteOpen)
                    }}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm flex items-center justify-between cursor-pointer hover:bg-accent/50"
                  >
                    <span>{startTime.split(':')[1]}</span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isStartMinuteOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isStartMinuteOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-50">
                      <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-2xl overflow-hidden">
                        <div className="max-h-48 overflow-y-auto">
                          {minutes.map((minute) => (
                            <button key={minute} type="button" onClick={() => { setStartTime(`${startTime.split(':')[0]}:${minute}`); setIsStartMinuteOpen(false) }}
                              className={`w-full px-4 py-2 text-left text-sm transition-all hover:bg-accent ${startTime.split(':')[1] === minute ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}>
                              {minute}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                下课时间 <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-1">
                <div className="relative flex-1" ref={endHourRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDaySelectOpen(false); setIsStartHourOpen(false); setIsStartMinuteOpen(false); setIsEndMinuteOpen(false); setIsEndHourOpen(!isEndHourOpen)
                    }}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm flex items-center justify-between cursor-pointer hover:bg-accent/50"
                  >
                    <span>{endTime.split(':')[0]}</span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isEndHourOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isEndHourOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-50">
                      <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-2xl overflow-hidden">
                        <div className="max-h-48 overflow-y-auto">
                          {hours.map((hour) => (
                            <button key={hour} type="button" onClick={() => { setEndTime(`${hour}:${endTime.split(':')[1]}`); setIsEndHourOpen(false) }}
                              className={`w-full px-4 py-2 text-left text-sm transition-all hover:bg-accent ${endTime.split(':')[0] === hour ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}>
                              {hour}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-muted-foreground font-medium">:</span>
                <div className="relative flex-1" ref={endMinuteRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDaySelectOpen(false); setIsStartHourOpen(false); setIsStartMinuteOpen(false); setIsEndHourOpen(false); setIsEndMinuteOpen(!isEndMinuteOpen)
                    }}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm flex items-center justify-between cursor-pointer hover:bg-accent/50"
                  >
                    <span>{endTime.split(':')[1]}</span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isEndMinuteOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isEndMinuteOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-50">
                      <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-2xl overflow-hidden">
                        <div className="max-h-48 overflow-y-auto">
                          {minutes.map((minute) => (
                            <button key={minute} type="button" onClick={() => { setEndTime(`${endTime.split(':')[0]}:${minute}`); setIsEndMinuteOpen(false) }}
                              className={`w-full px-4 py-2 text-left text-sm transition-all hover:bg-accent ${endTime.split(':')[1] === minute ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}>
                              {minute}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors text-sm font-medium">取消</button>
            <button type="submit" disabled={saving} className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium">
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditScheduleModal({
  schedule,
  onClose,
  onSaved,
}: {
  schedule: ClassSchedule
  onClose: () => void
  onSaved: () => void
}) {
  const [dayOfWeek, setDayOfWeek] = useState(schedule.dayOfWeek)
  const [startTime, setStartTime] = useState(schedule.startTime)
  const [endTime, setEndTime] = useState(schedule.endTime)
  const [saving, setSaving] = useState(false)
  const [isStartHourOpen, setIsStartHourOpen] = useState(false)
  const [isStartMinuteOpen, setIsStartMinuteOpen] = useState(false)
  const [isEndHourOpen, setIsEndHourOpen] = useState(false)
  const [isEndMinuteOpen, setIsEndMinuteOpen] = useState(false)
  const startHourRef = useRef<HTMLDivElement>(null)
  const startMinuteRef = useRef<HTMLDivElement>(null)
  const endHourRef = useRef<HTMLDivElement>(null)
  const endMinuteRef = useRef<HTMLDivElement>(null)

  const daysOfWeek = [
    { value: 0, label: '周日' },
    { value: 1, label: '周一' },
    { value: 2, label: '周二' },
    { value: 3, label: '周三' },
    { value: 4, label: '周四' },
    { value: 5, label: '周五' },
    { value: 6, label: '周六' },
  ]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (startHourRef.current && !startHourRef.current.contains(event.target as Node)) setIsStartHourOpen(false)
      if (startMinuteRef.current && !startMinuteRef.current.contains(event.target as Node)) setIsStartMinuteOpen(false)
      if (endHourRef.current && !endHourRef.current.contains(event.target as Node)) setIsEndHourOpen(false)
      if (endMinuteRef.current && !endMinuteRef.current.contains(event.target as Node)) setIsEndMinuteOpen(false)
    }
    if (isStartHourOpen || isStartMinuteOpen || isEndHourOpen || isEndMinuteOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => { document.removeEventListener('mousedown', handleClickOutside) }
  }, [isStartHourOpen, isStartMinuteOpen, isEndHourOpen, isEndMinuteOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    updateClassSchedule(schedule.id, { dayOfWeek, startTime, endTime })
    setSaving(false)
    onSaved()
  }

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
  const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-xl border border-border shadow-2xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">编辑上课时间</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              星期 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-7 gap-2">
              {daysOfWeek.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => setDayOfWeek(day.value)}
                  className={`py-2 rounded-lg border border-border text-sm transition-all ${
                    dayOfWeek === day.value
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-background text-foreground hover:bg-accent/50 hover:border-primary/30'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                上课时间 <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-1">
                <div className="relative flex-1" ref={startHourRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsStartMinuteOpen(false); setIsEndHourOpen(false); setIsEndMinuteOpen(false); setIsStartHourOpen(!isStartHourOpen)
                    }}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm flex items-center justify-between cursor-pointer hover:bg-accent/50"
                  >
                    <span>{startTime.split(':')[0]}</span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isStartHourOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isStartHourOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-50">
                      <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-2xl overflow-hidden">
                        <div className="max-h-48 overflow-y-auto">
                          {hours.map((hour) => (
                            <button key={hour} type="button" onClick={() => { setStartTime(`${hour}:${startTime.split(':')[1]}`); setIsStartHourOpen(false) }}
                              className={`w-full px-4 py-2 text-left text-sm transition-all hover:bg-accent ${startTime.split(':')[0] === hour ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}>
                              {hour}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-muted-foreground font-medium">:</span>
                <div className="relative flex-1" ref={startMinuteRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsStartHourOpen(false); setIsEndHourOpen(false); setIsEndMinuteOpen(false); setIsStartMinuteOpen(!isStartMinuteOpen)
                    }}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm flex items-center justify-between cursor-pointer hover:bg-accent/50"
                  >
                    <span>{startTime.split(':')[1]}</span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isStartMinuteOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isStartMinuteOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-50">
                      <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-2xl overflow-hidden">
                        <div className="max-h-48 overflow-y-auto">
                          {minutes.map((minute) => (
                            <button key={minute} type="button" onClick={() => { setStartTime(`${startTime.split(':')[0]}:${minute}`); setIsStartMinuteOpen(false) }}
                              className={`w-full px-4 py-2 text-left text-sm transition-all hover:bg-accent ${startTime.split(':')[1] === minute ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}>
                              {minute}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                下课时间 <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-1">
                <div className="relative flex-1" ref={endHourRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsStartHourOpen(false); setIsStartMinuteOpen(false); setIsEndMinuteOpen(false); setIsEndHourOpen(!isEndHourOpen)
                    }}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm flex items-center justify-between cursor-pointer hover:bg-accent/50"
                  >
                    <span>{endTime.split(':')[0]}</span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isEndHourOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isEndHourOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-50">
                      <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-2xl overflow-hidden">
                        <div className="max-h-48 overflow-y-auto">
                          {hours.map((hour) => (
                            <button key={hour} type="button" onClick={() => { setEndTime(`${hour}:${endTime.split(':')[1]}`); setIsEndHourOpen(false) }}
                              className={`w-full px-4 py-2 text-left text-sm transition-all hover:bg-accent ${endTime.split(':')[0] === hour ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}>
                              {hour}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-muted-foreground font-medium">:</span>
                <div className="relative flex-1" ref={endMinuteRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsStartHourOpen(false); setIsStartMinuteOpen(false); setIsEndHourOpen(false); setIsEndMinuteOpen(!isEndMinuteOpen)
                    }}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm flex items-center justify-between cursor-pointer hover:bg-accent/50"
                  >
                    <span>{endTime.split(':')[1]}</span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isEndMinuteOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isEndMinuteOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-50">
                      <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-2xl overflow-hidden">
                        <div className="max-h-48 overflow-y-auto">
                          {minutes.map((minute) => (
                            <button key={minute} type="button" onClick={() => { setEndTime(`${endTime.split(':')[0]}:${minute}`); setIsEndMinuteOpen(false) }}
                              className={`w-full px-4 py-2 text-left text-sm transition-all hover:bg-accent ${endTime.split(':')[1] === minute ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}>
                              {minute}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors text-sm font-medium">取消</button>
            <button type="submit" disabled={saving} className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium">
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CreateStudentModal({
  classId,
  classType,
  onClose,
  onCreated,
}: {
  classId: string
  classType: ClassType
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    const { saveStudent } = require('@/lib/store')
    saveStudent({
      name: name.trim(),
      class: classType,
      classId,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
    })
    setSaving(false)
    onCreated()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-xl border border-border shadow-2xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">新建学生</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="学生姓名"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm hover:bg-accent/50 cursor-pointer"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm hover:bg-accent/50 cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">电话</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="手机号码"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm hover:bg-accent/50 cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">备注</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="可选备注信息..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm resize-none"
            />
          </div>
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors text-sm font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
            >
              {saving ? '保存中...' : '创建学生'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ImportStudentsModal({
  classId,
  classType,
  onClose,
  onImported,
}: {
  classId: string
  classType: ClassType
  onClose: () => void
  onImported: () => void
}) {
  const [namesText, setNamesText] = useState('')
  const [importing, setImporting] = useState(false)
  const [parsedNames, setParsedNames] = useState<string[]>([])

  // 解析名字文本
  const parseNames = (text: string): string[] => {
    if (!text.trim()) return []
    
    // 按行分割，过滤空行和空白字符
    return text
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0)
  }

  // 当文本变化时更新解析结果
  useEffect(() => {
    const names = parseNames(namesText)
    setParsedNames(names)
  }, [namesText])

  const handleImport = async () => {
    const names = parseNames(namesText)
    if (names.length === 0) return

    setImporting(true)
    
    // 模拟延迟
    await new Promise((resolve) => setTimeout(resolve, 500))
    
    try {
      const { saveStudent } = require('@/lib/store')
      
      // 批量创建学生
      names.forEach(name => {
        saveStudent({
          name,
          class: classType,
          classId,
          // 其他字段留空
          email: '',
          phone: '',
          notes: '',
        })
      })
      
      setImporting(false)
      onImported()
    } catch (error) {
      console.error('导入学生失败:', error)
      setImporting(false)
      alert('导入失败，请重试')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-xl border border-border shadow-2xl w-full max-w-2xl mx-4 p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">批量导入学生</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              学生姓名列表 <span className="text-red-500">*</span>
              <span className="text-xs text-muted-foreground ml-2">(每行一个姓名)</span>
            </label>
            <textarea
              value={namesText}
              onChange={(e) => setNamesText(e.target.value)}
              placeholder="例如：&#10;张三&#10;李四&#10;王五&#10;..."
              rows={8}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm resize-none font-mono hover:bg-accent/50 cursor-pointer"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1">
              提示：每行输入一个学生姓名，系统将自动创建这些学生并添加到当前班级。
            </p>
          </div>

          {/* 预览区域 */}
          {parsedNames.length > 0 && (
            <div className="border border-border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-foreground">预览 ({parsedNames.length} 名学生)</h3>
                <span className="text-xs text-muted-foreground">
                  将创建以下学生：
                </span>
              </div>
              <div className="max-h-40 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {parsedNames.map((name, index) => (
                    <div key={index} className="px-3 py-1.5 rounded-lg bg-background border border-border text-sm">
                      <span className="font-medium">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              {parsedNames.length > 0 ? (
                <span>共 {parsedNames.length} 名学生待导入</span>
              ) : (
                <span>请输入学生姓名列表</span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors text-sm font-medium"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={parsedNames.length === 0 || importing}
                className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
              >
                {importing ? '导入中...' : `导入 (${parsedNames.length})`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RecordsTab({ classId, students }: { classId: string; students: Student[] }) {
  const [records, setRecords] = useState<any[]>([])
  const [showAddRecordModal, setShowAddRecordModal] = useState(false)

  const loadRecords = () => {
    const { getRecordsByClass } = require('@/lib/store')
    setRecords(getRecordsByClass(classId))
  }

  useEffect(() => {
    loadRecords()
  }, [classId])

  const getStudentName = (studentId: string) => {
    return students.find((s) => s.id === studentId)?.name || '未知学生'
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'homework': return '📝'
      case 'quiz': return '📊'
      case 'feedback': return '💬'
      case 'attendance': return '✅'
      default: return '📌'
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      homework: '作业',
      quiz: '小测',
      feedback: '反馈',
      attendance: '考勤',
      other: '其他',
    }
    return labels[type] || type
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这条记录吗？')) {
      const { deleteRecord } = require('@/lib/store')
      deleteRecord(id)
      loadRecords()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">班级数据记录</h3>
          <p className="text-sm text-muted-foreground mt-1">
            手动记录学生的作业、小测、考勤等数据
          </p>
        </div>
        <button
          onClick={() => setShowAddRecordModal(true)}
          className="inline-flex items-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium whitespace-nowrap"
        >
          <Plus className="h-4 w-4 mr-2" />
          添加记录
        </button>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">暂无数据记录</h3>
          <p className="text-muted-foreground mb-6">
            点击上方按钮手动添加学生的作业、小测、考勤等记录
          </p>
          <button
            onClick={() => setShowAddRecordModal(true)}
            className="inline-flex items-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            添加记录
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap">类型</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap">学生</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap">内容</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap">成绩</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.map((record: any) => (
                <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-lg">{getTypeIcon(record.type)}</span>
                    <span className="ml-2 text-sm text-muted-foreground">{getTypeLabel(record.type)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-foreground">
                      {getStudentName(record.studentId)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted-foreground line-clamp-1">
                      {record.content || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {record.score !== undefined ? (
                      <span className="text-sm font-medium text-foreground">
                        {record.score}{record.totalScore ? `/${record.totalScore}` : ''}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {new Date(record.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="p-1 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {showAddRecordModal && (
        <AddRecordModal
          classId={classId}
          students={students}
          onClose={() => setShowAddRecordModal(false)}
          onSaved={() => {
            setShowAddRecordModal(false)
            loadRecords()
          }}
        />
      )}
    </div>
  )
}

function AddRecordModal({
  classId,
  students,
  onClose,
  onSaved,
}: {
  classId: string
  students: Student[]
  onClose: () => void
  onSaved: () => void
}) {
  const [studentId, setStudentId] = useState(students.length > 0 ? students[0].id : '')
  const [type, setType] = useState<string>('homework')
  const [content, setContent] = useState('')
  const [score, setScore] = useState('')
  const [totalScore, setTotalScore] = useState('')
  const [saving, setSaving] = useState(false)
  const [isStudentSelectOpen, setIsStudentSelectOpen] = useState(false)
  const [isTypeSelectOpen, setIsTypeSelectOpen] = useState(false)
  const studentSelectRef = useRef<HTMLDivElement>(null)
  const typeSelectRef = useRef<HTMLDivElement>(null)

  const recordTypeOptions = [
    { value: 'homework', label: '作业', icon: '📝' },
    { value: 'quiz', label: '小测', icon: '📊' },
    { value: 'feedback', label: '反馈', icon: '💬' },
    { value: 'attendance', label: '考勤', icon: '✅' },
    { value: 'other', label: '其他', icon: '📌' },
  ]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (studentSelectRef.current && !studentSelectRef.current.contains(event.target as Node)) setIsStudentSelectOpen(false)
      if (typeSelectRef.current && !typeSelectRef.current.contains(event.target as Node)) setIsTypeSelectOpen(false)
    }
    if (isStudentSelectOpen || isTypeSelectOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => { document.removeEventListener('mousedown', handleClickOutside) }
  }, [isStudentSelectOpen, isTypeSelectOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId || !content.trim()) return
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    const { saveRecord } = require('@/lib/store')
    saveRecord({
      classId,
      studentId,
      type,
      content: content.trim(),
      score: score ? Number(score) : undefined,
      totalScore: totalScore ? Number(totalScore) : undefined,
      createdBy: '助教',
    })
    setSaving(false)
    onSaved()
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 lg:left-64 lg:w-[calc(100%-256px)] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 lg:left-64 lg:w-[calc(100%-256px)] flex items-center justify-center p-6">
        <div
          className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-[600px] max-h-[calc(100vh-120px)] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-3 sm:p-4 pb-0 flex-shrink-0">
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">
              添加数据记录
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 w-full">
            <div className="flex-1 overflow-y-auto scrollbar-thin pt-2 pb-3 sm:pt-3 sm:pb-4 px-3 sm:px-4 space-y-2 sm:space-y-3 w-full min-h-0">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  学生 <span className="text-red-500">*</span>
                </label>
                <div className="relative" ref={studentSelectRef}>
                  <button
                    type="button"
                    onClick={() => setIsStudentSelectOpen(!isStudentSelectOpen)}
                    className="w-full px-3 py-2 sm:py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm flex items-center justify-between cursor-pointer hover:bg-accent/50"
                  >
                    <span>{students.find(s => s.id === studentId)?.name || '请选择学生'}</span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isStudentSelectOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isStudentSelectOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-50">
                      <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-2xl overflow-hidden">
                        <div className="max-h-48 overflow-y-auto">
                          {students.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => { setStudentId(s.id); setIsStudentSelectOpen(false) }}
                              className={`w-full px-4 py-3 text-left text-sm transition-all hover:bg-accent ${studentId === s.id ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}
                            >
                              {s.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">记录类型</label>
                <div className="relative" ref={typeSelectRef}>
                  <button
                    type="button"
                    onClick={() => setIsTypeSelectOpen(!isTypeSelectOpen)}
                    className="w-full px-3 py-2 sm:py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm flex items-center justify-between cursor-pointer hover:bg-accent/50"
                  >
                    <span className="flex items-center gap-2">
                      <span>{recordTypeOptions.find(opt => opt.value === type)?.icon}</span>
                      <span>{recordTypeOptions.find(opt => opt.value === type)?.label || '选择类型'}</span>
                    </span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isTypeSelectOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isTypeSelectOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-50">
                      <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-2xl overflow-hidden">
                        <div className="max-h-48 overflow-y-auto">
                          {recordTypeOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setType(option.value)
                                setIsTypeSelectOpen(false)
                              }}
                              className={`w-full px-4 py-3 text-left text-sm transition-all hover:bg-accent flex items-center gap-2 ${type === option.value ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}
                            >
                              <span>{option.icon}</span>
                              <span>{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  内容描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="例如：完成第3单元练习题，正确率良好"
                  className="w-full px-3 py-2 sm:py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm min-h-[60px] sm:min-h-[80px] resize-none hover:bg-accent/50 cursor-pointer"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">得分</label>
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="例如：85"
                    min="0"
                    className="w-full px-3 py-2 sm:py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm hover:bg-accent/50 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">满分</label>
                  <input
                    type="number"
                    value={totalScore}
                    onChange={(e) => setTotalScore(e.target.value)}
                    placeholder="例如：100"
                    min="0"
                    className="w-full px-3 py-2 sm:py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm hover:bg-accent/50 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-4 pt-0 w-full flex-shrink-0 border-t border-border/50 bg-card/95 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors text-sm font-medium shadow-sm"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!studentId || !content.trim() || saving}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium shadow-sm"
                >
                  {saving ? '保存中...' : '添加记录'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}