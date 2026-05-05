'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Plus, Search, GraduationCap, Pencil, Trash2, MoreHorizontal, Mail, Phone, ChevronDown } from 'lucide-react'
import { Student, ClassType } from '@/types'
import { getStudents, saveStudent, updateStudent, deleteStudent, getClassTypeLabel, getClassTypeColor, getClasses } from '@/lib/store'
import { cn } from '@/lib/utils'
import { PageContainer } from '@/components/ui/page-container'

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<ClassType | 'ALL'>('ALL')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setStudents(getStudents())
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) setIsFilterOpen(false)
    }
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => { document.removeEventListener('mousedown', handleClickOutside) }
  }, [isFilterOpen])

  const refreshStudents = () => {
    setStudents(getStudents())
  }

  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone?.includes(searchQuery)
    const matchesType = typeFilter === 'ALL' || s.class === typeFilter
    return matchesSearch && matchesType
  })

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个学生吗？此操作不可撤销。')) {
      deleteStudent(id)
      refreshStudents()
    }
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center flex-wrap gap-3 justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">学生管理</h1>
            <p className="text-muted-foreground mt-1">管理所有学生信息</p>
          </div>
          <button
            onClick={() => {
              setEditingStudent(null)
              setShowCreateModal(true)
            }}
            className="inline-flex items-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            添加学生
          </button>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索学生姓名、邮箱或电话..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            />
          </div>
        <div className="relative" ref={filterRef}>
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="px-3 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm flex items-center cursor-pointer hover:bg-accent/50 whitespace-nowrap"
          >
            {typeFilter === 'ALL' ? '全部类型' : getClassTypeLabel(typeFilter as ClassType)}
            <ChevronDown className={`h-4 w-4 ml-2 text-muted-foreground transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
          </button>
          {isFilterOpen && (
            <div className="absolute top-full right-0 mt-1 z-50 min-w-[160px]">
              <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-2xl overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => { setTypeFilter('ALL'); setIsFilterOpen(false) }}
                    className={`w-full px-4 py-3 text-left text-sm transition-all hover:bg-accent ${typeFilter === 'ALL' ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}
                  >
                    全部类型
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTypeFilter('GY'); setIsFilterOpen(false) }}
                    className={`w-full px-4 py-3 text-left text-sm transition-all hover:bg-accent ${typeFilter === 'GY' ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}
                  >
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium mr-2', getClassTypeColor('GY'))}>GY</span>
                    GY
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTypeFilter('KET'); setIsFilterOpen(false) }}
                    className={`w-full px-4 py-3 text-left text-sm transition-all hover:bg-accent ${typeFilter === 'KET' ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}
                  >
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium mr-2', getClassTypeColor('KET'))}>KET</span>
                    KET
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTypeFilter('PET'); setIsFilterOpen(false) }}
                    className={`w-full px-4 py-3 text-left text-sm transition-all hover:bg-accent ${typeFilter === 'PET' ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}
                  >
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium mr-2', getClassTypeColor('PET'))}>PET</span>
                    PET
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTypeFilter('FCE'); setIsFilterOpen(false) }}
                    className={`w-full px-4 py-3 text-left text-sm transition-all hover:bg-accent ${typeFilter === 'FCE' ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}
                  >
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium mr-2', getClassTypeColor('FCE'))}>FCE</span>
                    FCE
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTypeFilter('CAE'); setIsFilterOpen(false) }}
                    className={`w-full px-4 py-3 text-left text-sm transition-all hover:bg-accent ${typeFilter === 'CAE' ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}
                  >
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium mr-2', getClassTypeColor('CAE'))}>CAE</span>
                    CAE
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTypeFilter('CPE'); setIsFilterOpen(false) }}
                    className={`w-full px-4 py-3 text-left text-sm transition-all hover:bg-accent ${typeFilter === 'CPE' ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}
                  >
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium mr-2', getClassTypeColor('CPE'))}>CPE</span>
                    CPE
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTypeFilter('OTHER'); setIsFilterOpen(false) }}
                    className={`w-full px-4 py-3 text-left text-sm transition-all hover:bg-accent ${typeFilter === 'OTHER' ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}
                  >
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium mr-2', getClassTypeColor('OTHER'))}>其他</span>
                    其他
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <GraduationCap className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            {searchQuery || typeFilter !== 'ALL' ? '没有找到匹配的学生' : '还没有添加学生'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || typeFilter !== 'ALL' ? '试试调整搜索条件' : '点击上方按钮添加第一个学生'}
          </p>
          {!searchQuery && typeFilter === 'ALL' && (
            <button
              onClick={() => {
                setEditingStudent(null)
                setShowCreateModal(true)
              }}
              className="inline-flex items-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4 mr-2" />
              添加学生
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
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
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {student.name.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium', getClassTypeColor(student.class))}>
                        {getClassTypeLabel(student.class)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-muted-foreground space-y-0.5">
                        {student.email && (
                          <div className="flex items-center">
                            <Mail className="h-3.5 w-3.5 mr-1.5" />
                            {student.email}
                          </div>
                        )}
                        {student.phone && (
                          <div className="flex items-center">
                            <Phone className="h-3.5 w-3.5 mr-1.5" />
                            {student.phone}
                          </div>
                        )}
                        {!student.email && !student.phone && <span className="text-xs">-</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-muted-foreground max-w-[200px] block truncate">
                        {student.notes || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right relative whitespace-nowrap">
                      <button
                        onClick={() => setMenuOpen(menuOpen === student.id ? null : student.id)}
                        className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                      >
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </button>

                      {menuOpen === student.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                          <div className="absolute right-4 top-12 z-20 w-36 rounded-lg border border-border bg-card shadow-lg py-1">
                            <button
                              onClick={() => {
                                setEditingStudent(student)
                                setShowCreateModal(true)
                                setMenuOpen(null)
                              }}
                              className="flex items-center w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              编辑
                            </button>
                            <button
                              onClick={() => {
                                handleDelete(student.id)
                                setMenuOpen(null)
                              }}
                              className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              删除
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(showCreateModal) && (
        <StudentFormModal
          studentData={editingStudent}
          onClose={() => {
            setShowCreateModal(false)
            setEditingStudent(null)
          }}
          onSave={() => {
            setShowCreateModal(false)
            setEditingStudent(null)
            refreshStudents()
          }}
        />
      )}
      </div>
    </PageContainer>
  )
}

function StudentFormModal({
  studentData,
  onClose,
  onSave,
}: {
  studentData: Student | null
  onClose: () => void
  onSave: () => void
}) {
  const [name, setName] = useState(studentData?.name || '')
  const [classType, setClassType] = useState<ClassType>(studentData?.class || 'OTHER')
  const [email, setEmail] = useState(studentData?.email || '')
  const [phone, setPhone] = useState(studentData?.phone || '')
  const [notes, setNotes] = useState(studentData?.notes || '')
  const [saving, setSaving] = useState(false)
  const [isClassSelectOpen, setIsClassSelectOpen] = useState(false)
  const classSelectRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (classSelectRef.current && !classSelectRef.current.contains(event.target as Node)) setIsClassSelectOpen(false)
    }
    if (isClassSelectOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => { document.removeEventListener('mousedown', handleClickOutside) }
  }, [isClassSelectOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 300))

    if (studentData) {
      updateStudent(studentData.id, {
        name: name.trim(),
        class: classType,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
      })
    } else {
      saveStudent({
        name: name.trim(),
        class: classType,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
      })
    }

    setSaving(false)
    onSave()
  }

  const classTypeOptions = [
    { value: 'GY' as ClassType, label: 'GY' },
    { value: 'KET' as ClassType, label: 'KET' },
    { value: 'PET' as ClassType, label: 'PET' },
    { value: 'FCE' as ClassType, label: 'FCE' },
    { value: 'CAE' as ClassType, label: 'CAE' },
    { value: 'CPE' as ClassType, label: 'CPE' },
    { value: 'OTHER' as ClassType, label: '其他' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-xl border border-border shadow-2xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">
          {studentData ? '编辑学生' : '添加学生'}
        </h2>

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
            <label className="block text-sm font-medium text-foreground mb-1.5">班级类型</label>
            <div className="relative" ref={classSelectRef}>
              <button
                type="button"
                onClick={() => setIsClassSelectOpen(!isClassSelectOpen)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm flex items-center justify-between cursor-pointer hover:bg-accent/50"
              >
                <span>{classTypeOptions.find(opt => opt.value === classType)?.label}</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isClassSelectOpen ? 'rotate-180' : ''}`} />
              </button>
              {isClassSelectOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50">
                  <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-2xl overflow-hidden">
                    <div className="max-h-60 overflow-y-auto">
                      {classTypeOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setClassType(option.value)
                            setIsClassSelectOpen(false)
                          }}
                          className={`w-full px-4 py-3 text-left text-sm transition-all hover:bg-accent ${classType === option.value ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}
                        >
                          <span className={cn('px-2 py-0.5 rounded text-xs font-medium mr-3', getClassTypeColor(option.value))}>
                            {getClassTypeLabel(option.value)}
                          </span>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">备注</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="可选备注信息..."
              rows={3}
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
              {saving ? '保存中...' : studentData ? '保存修改' : '添加学生'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
