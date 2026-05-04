'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Users, MoreHorizontal, Pencil, Trash2, BookOpen, Home, Clock, X, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Class, ClassType, ClassSchedule } from '@/types'
import { getClasses, deleteClass, getClassTypeLabel, getClassTypeColor, getClassSchedules } from '@/lib/store'
import { cn } from '@/lib/utils'
import { PageContainer } from '@/components/ui/page-container'
import { TeacherSwitcher } from '@/components/assistant/teacher-switcher'
import { useAuth } from '@/lib/auth-store'
import { useRoleAccess } from '@/lib/use-role-access'

function getDayOfWeekLabel(day: number): string {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[day] || `星期${day}`
}

function formatScheduleDisplay(schedules?: ClassSchedule[]): string {
  if (!schedules || schedules.length === 0) {
    return '未设置上课时间'
  }
  
  // 按星期排序
  const sortedSchedules = [...schedules].sort((a, b) => a.dayOfWeek - b.dayOfWeek)
  
  // 只显示前2个时间，如果有更多则显示"等"
  const displayCount = Math.min(2, sortedSchedules.length)
  const displaySchedules = sortedSchedules.slice(0, displayCount)
  
  const formatted = displaySchedules.map(s => 
    `${getDayOfWeekLabel(s.dayOfWeek)} ${s.startTime}-${s.endTime}`
  ).join('、')
  
  if (sortedSchedules.length > displayCount) {
    return `${formatted} 等${sortedSchedules.length}个时间`
  }
  
  return formatted
}

export default function ClassesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { isSuperAdmin, isClassAdmin, isAssistant } = useRoleAccess()
  const [classes, setClasses] = useState<Class[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const canEdit = isSuperAdmin || isClassAdmin || isAssistant

  useEffect(() => {
    setClasses(getClasses())
    const handler = () => setClasses([...getClasses()])
    window.addEventListener('classDataChanged', handler)
    return () => window.removeEventListener('classDataChanged', handler)
  }, [])

  const refreshClasses = () => {
    setClasses([...getClasses()])
  }

  const filteredClasses = classes.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getClassTypeLabel(c.type).toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个班级吗？班级中的学生将被移出该班级。')) {
      deleteClass(id)
      refreshClasses()
    }
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center flex-wrap gap-3 justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-lg hover:bg-accent hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <Home className="h-5 w-5 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">班级管理</h1>
              <p className="text-muted-foreground mt-1">管理所有班级和学员信息</p>
            </div>
          </div>
          {isAssistant && <TeacherSwitcher />}
          {canEdit && (
            <button
              onClick={() => {
                setEditingClass(null)
                setShowCreateModal(true)
              }}
              className="inline-flex items-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium whitespace-nowrap"
            >
              <Plus className="h-4 w-4 mr-2" />
              创建班级
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索班级名称或类型..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
          />
        </div>

        {filteredClasses.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchQuery ? '没有找到匹配的班级' : '还没有创建班级'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? '试试其他搜索关键词' : '点击上方按钮创建第一个班级'}
            </p>
            {!searchQuery && canEdit && (
              <button
                onClick={() => {
                  setEditingClass(null)
                  setShowCreateModal(true)
                }}
                className="inline-flex items-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium whitespace-nowrap"
              >
                <Plus className="h-4 w-4 mr-2" />
                创建班级
              </button>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-wrap gap-4"
          >
            {filteredClasses.map((cls, index) => (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="group relative rounded-xl border border-border bg-card hover:shadow-md hover:scale-[1.02] hover:border-primary/30 transition-all duration-300 ease-out flex-1 min-w-[280px]"
              >
              <Link href={`/classes/${cls.id}`} className="block p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-lg bg-primary/5">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{cls.name}</h3>
                      <span
                        className={cn(
                          'inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium',
                          getClassTypeColor(cls.type)
                        )}
                      >
                        {getClassTypeLabel(cls.type)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="h-4 w-4 mr-1.5" />
                  <span>{cls.studentCount} 名学生</span>
                </div>

                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Clock className="h-4 w-4 mr-1.5" />
                  <span>{formatScheduleDisplay(getClassSchedules(cls.id))}</span>
                </div>

                {cls.createdBy && (
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <Users className="h-4 w-4 mr-1.5" />
                    <span>由 {cls.createdBy} 添加</span>
                  </div>
                )}

                {cls.description && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {cls.description}
                  </p>
                )}
              </Link>

              <div className="absolute top-3 right-3">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    setMenuOpen(menuOpen === cls.id ? null : cls.id)
                  }}
                  className="p-1.5 rounded-lg hover:bg-accent md:opacity-0 md:group-hover:opacity-100 transition-all"
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </button>

                {menuOpen === cls.id && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(null)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -5, scale: 0.95 }}
                      className="absolute right-0 top-10 z-20 w-36 rounded-lg border border-border bg-card shadow-lg py-1"
                    >
                      {canEdit && (
                        <button
                          onClick={() => {
                            setEditingClass(cls)
                            setShowCreateModal(true)
                            setMenuOpen(null)
                          }}
                          className="flex items-center w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          编辑
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => {
                            handleDelete(cls.id)
                            setMenuOpen(null)
                          }}
                          className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          删除
                        </button>
                      )}
                    </motion.div>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {(showCreateModal) && (
        <ClassFormModal
          classData={editingClass}
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false)
            setEditingClass(null)
          }}
          onSave={() => {
            setShowCreateModal(false)
            setEditingClass(null)
            refreshClasses()
          }}
          isAssistant={isAssistant}
          currentUserName={user?.displayName || user?.username || ''}
        />
      )}
        </div>
    </PageContainer>
  )
}

function ClassFormModal({
  classData,
  onClose,
  onSave,
  isOpen,
  isAssistant,
  currentUserName,
}: {
  classData: Class | null
  onClose: () => void
  onSave: () => void
  isOpen: boolean
  isAssistant?: boolean
  currentUserName?: string
}) {
  const [name, setName] = useState(classData?.name || '')
  const [type, setType] = useState<ClassType>(classData?.type || 'OTHER')
  const [description, setDescription] = useState(classData?.description || '')
  const [saving, setSaving] = useState(false)
  const [isSelectOpen, setIsSelectOpen] = useState(false)
  const [dayOfWeek, setDayOfWeek] = useState<number>(1) // 1=周一
  const TIME_SLOTS = [
    { id: 'T1', label: 'T1', startTime: '08:30', endTime: '10:30' },
    { id: 'T2', label: 'T2', startTime: '10:40', endTime: '12:40' },
    { id: 'T3', label: 'T3', startTime: '14:20', endTime: '16:20' },
    { id: 'T4', label: 'T4', startTime: '16:30', endTime: '18:30' },
    { id: 'T5', label: 'T5', startTime: '19:00', endTime: '21:00' },
  ]
  const [selectedSlot, setSelectedSlot] = useState('T1')
  const [isDaySelectOpen, setIsDaySelectOpen] = useState(false)
  const [syncToTeacher, setSyncToTeacher] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)
  const daySelectRef = useRef<HTMLDivElement>(null)
  const modalContentRef = useRef<HTMLDivElement>(null)

  // 编辑模式时，从已有班级数据加载上课时间
  useEffect(() => {
    if (classData && classData.schedules && classData.schedules.length > 0) {
      const s = classData.schedules[0]
      setDayOfWeek(s.dayOfWeek)
      const found = TIME_SLOTS.find(slot => slot.startTime === s.startTime && slot.endTime === s.endTime)
      setSelectedSlot(found ? found.id : 'T1')
    } else {
      setDayOfWeek(1)
      setSelectedSlot('T1')
    }
  }, [classData?.id])

  const classTypeOptions = [
    { value: 'GY' as ClassType, label: 'GY' },
    { value: 'KET' as ClassType, label: 'KET' },
    { value: 'PET' as ClassType, label: 'PET' },
    { value: 'FCE' as ClassType, label: 'FCE' },
    { value: 'CAE' as ClassType, label: 'CAE' },
    { value: 'CPE' as ClassType, label: 'CPE' },
    { value: 'OTHER' as ClassType, label: '其他' },
  ]

  const daysOfWeek = [
    { value: 1, label: '周一' },
    { value: 2, label: '周二' },
    { value: 3, label: '周三' },
    { value: 4, label: '周四' },
    { value: 5, label: '周五' },
    { value: 6, label: '周六' },
    { value: 0, label: '周日' },
  ]





  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsSelectOpen(false)
      }
      if (daySelectRef.current && !daySelectRef.current.contains(event.target as Node)) {
        setIsDaySelectOpen(false)
      }
    }

    if (isSelectOpen || isDaySelectOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSelectOpen, isDaySelectOpen])

  // 当下拉菜单打开时，滚动到可见位置
  useEffect(() => {
    const scrollToMakeVisible = () => {
      if (modalContentRef.current) {
        // 给一点延迟确保DOM已更新
        setTimeout(() => {
          if (modalContentRef.current) {
            modalContentRef.current.scrollTo({
              top: modalContentRef.current.scrollHeight,
              behavior: 'smooth'
            })
          }
        }, 50)
      }
    }

    if (isDaySelectOpen) {
      scrollToMakeVisible()
    }
  }, [isDaySelectOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)

    await new Promise((resolve) => setTimeout(resolve, 300))

    const slot = TIME_SLOTS.find(s => s.id === selectedSlot) || TIME_SLOTS[0]
    const startTime = slot.startTime
    const endTime = slot.endTime

    try {
      if (classData) {
        const { updateClass, saveClassSchedule, getClassSchedules, updateClassSchedule, deleteClassSchedule } = await import('@/lib/store')
        updateClass(classData.id, { name: name.trim(), type, description: description.trim() || undefined })
        
        // 保存上课时间
        if (dayOfWeek !== undefined) {
          const existingSchedules = getClassSchedules(classData.id)
          if (existingSchedules.length > 0) {
            // 更新第一个上课时间
            updateClassSchedule(existingSchedules[0].id, { dayOfWeek, startTime, endTime })
            // 删除多余的（如果有），确保只保留一个上课时间
            for (let i = 1; i < existingSchedules.length; i++) {
              deleteClassSchedule(existingSchedules[i].id)
            }
          } else {
            saveClassSchedule({ classId: classData.id, dayOfWeek, startTime, endTime })
          }
        }
      } else {
        const { saveClass, saveClassSchedule } = await import('@/lib/store')
        const newClass = saveClass({
          name: name.trim(),
          type,
          description: description.trim() || undefined,
          createdBy: currentUserName || undefined,
        })
        
        // 保存上课时间
        if (newClass && dayOfWeek) {
          saveClassSchedule({
            classId: newClass.id,
            dayOfWeek,
            startTime,
            endTime,
          })
        }

        // 同步至老师
        if (syncToTeacher && newClass) {
          const { syncClassToTeachers } = await import('@/lib/store')
          const syncResult = await syncClassToTeachers({
            classId: newClass.id,
            name: name.trim(),
            type,
          })
          if (syncResult && syncResult.syncedTo > 0) {
            alert(`班级已同步至 ${syncResult.syncedTo} 位老师的班级管理`)
          } else {
            alert('同步失败，请稍后重试')
          }
        }
      }

      setSaving(false)
      onSave()
    } catch (error) {
      console.error('保存班级失败:', error)
      setSaving(false)
      alert('保存失败，请重试')
    }
  }



  const ClassTypeDropdown = () => (
    <div className="relative" ref={selectRef}>
      {/* 自定义下拉触发器 */}
      <button
        type="button"
        onClick={() => setIsSelectOpen(!isSelectOpen)}
        className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm flex items-center justify-between cursor-pointer hover:bg-accent/50"
      >
        <span>{classTypeOptions.find(opt => opt.value === type)?.label || '选择类型'}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isSelectOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {/* 自定义下拉菜单 */}
      {isSelectOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50">
          <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-2xl overflow-hidden">
            <div className="max-h-48 overflow-y-auto">
              {classTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setType(option.value)
                    setIsSelectOpen(false)
                  }}
                  className={`w-full px-4 py-3 text-left text-sm transition-all hover:bg-accent ${type === option.value ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}
                >
                  <div className="flex items-center">
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium mr-3', getClassTypeColor(option.value))}>
                      {getClassTypeLabel(option.value)}
                    </span>
                    <span>{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* 当前选中项的预览 */}
      <div className="mt-2 flex items-center">
        <span className={cn('px-2.5 py-0.5 rounded text-xs font-medium mr-2', getClassTypeColor(type))}>
          {classTypeOptions.find(opt => opt.value === type)?.label || getClassTypeLabel(type)}
        </span>
        <span className="text-xs text-muted-foreground">
          当前选择
        </span>
      </div>
    </div>
  );

  // 弹窗打开时锁定背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      {/*
        遮罩层 - 点击关闭弹窗
        - onClick={onClose}: 点击遮罩层关闭弹窗
        - 覆盖范围与弹窗容器一致，大屏下只覆盖主内容区，不覆盖侧边栏
      */}
      <div 
        className="fixed inset-0 z-40 lg:left-64 lg:w-[calc(100%-256px)] bg-black/50 backdrop-blur-sm animate-in fade-in" 
        onClick={onClose}
      />
      
      {/*
        弹窗容器 - 在主内容区（灰色背景区域）内水平+垂直居中
        - fixed: 固定定位，覆盖整个视口
        - lg:left-64 lg:w-[calc(100%-256px)]: 大屏下避开左侧固定侧边栏（256px宽），
          使弹窗的居中范围限定在主内容区，不被侧边栏遮挡
        - flex items-center justify-center: flex布局实现水平+垂直居中
        - p-6: 与主内容区 p-6 保持一致，确保弹窗与主内容区边缘有24px安全间距
        - 注意：此容器不设 onClick，点击 p-6 间隙区域不会关闭弹窗，
          只有点击遮罩层（z-40）才会触发关闭，避免误触
      */}
      <div className="fixed inset-0 z-50 lg:left-64 lg:w-[calc(100%-256px)] flex items-center justify-center p-6">
        {/*
          弹窗主体 - 响应式宽度 + 动画
          - max-w-[600px]: 大屏下固定最大宽度600px
          - w-full: 宽度占满父容器可用宽度（受 p-6 限制，不会贴边）
          - max-h-[calc(100vh-120px)]: 最大高度为视口高度减120px，确保上下各有60px安全边距
          - overflow-hidden: 防止内容溢出破坏圆角
          - onClick.stopPropagation: 阻止点击弹窗内部冒泡到遮罩层，
            确保点击表单、按钮、输入框等内部元素时不触发关闭
        */}
        <div 
          className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-[600px] max-h-[calc(100vh-120px)] flex flex-col overflow-hidden animate-in slide-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-3 sm:p-4 pb-0 flex-shrink-0">
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">
              {classData ? '编辑班级' : '创建班级'}
            </h2>
          </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 w-full">
          {/*
            内容区域 - 可滚动，仅在内容溢出时显示滚动条
            - overflow-y-auto: 内容超出时自动显示垂直滚动条
            - scrollbar-thin: 自定义细滚动条样式，与项目UI一致
            - min-h-0: 确保flex子项能正确收缩到最小高度
          */}
          <div 
            ref={modalContentRef}
            className="flex-1 overflow-y-auto scrollbar-thin pt-2 pb-3 sm:pt-3 sm:pb-4 px-3 sm:px-4 space-y-2 sm:space-y-3 w-full min-h-0"
          >
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
              班级名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：KET 春季班"
              className="w-full px-3 py-2 sm:py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm hover:bg-accent/50 cursor-pointer"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              班级类型
            </label>
            <ClassTypeDropdown />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              班级描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="可选，描述班级特点、教学内容等"
              className="w-full px-3 py-2 sm:py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm min-h-[60px] sm:min-h-[80px] resize-none hover:bg-accent/50 cursor-pointer"
            />
          </div>

          {/* 上课时间设置 */}
          <div className="space-y-4 mb-3 sm:mb-4">
            <label className="block text-sm font-medium text-foreground">
              上课时间设置
            </label>
            
            <div className="space-y-3 p-3 sm:p-4 rounded-xl border border-border bg-muted/20 w-full box-border min-h-0">
              {/* 星期选择 */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  星期
                </label>
                <div className="relative" ref={daySelectRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDaySelectOpen(!isDaySelectOpen)
                    }}
                    className="w-full px-3 py-2 sm:py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm flex items-center justify-between cursor-pointer hover:bg-accent/50 backdrop-blur-sm"
                  >
                    <span>{daysOfWeek.find(d => d.value === dayOfWeek)?.label || '选择星期'}</span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isDaySelectOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isDaySelectOpen && (
                    <div className="absolute bottom-full left-0 right-0 mb-1 z-50 max-h-[40vh] overflow-y-auto">
                      <div className="rounded-2xl border border-border bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden">
                        <div className="max-h-32 sm:max-h-48 overflow-y-auto">
                          {daysOfWeek.map((day) => (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => {
                                setDayOfWeek(day.value)
                                setIsDaySelectOpen(false)
                              }}
                              className={`w-full px-4 py-3 text-left text-sm transition-all hover:bg-accent/50 ${dayOfWeek === day.value ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 时间段选择 */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  时间段
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`py-3 rounded-lg border border-border text-sm transition-all ${
                        selectedSlot === slot.id
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-background text-foreground hover:bg-accent/50 hover:border-primary/30'
                      }`}
                    >
                      <div className="font-medium">{slot.label}</div>
                      <div className={`text-[10px] mt-0.5 ${selectedSlot === slot.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                        {slot.startTime}-{slot.endTime}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 时间预览 */}
              <div className="pt-2 min-w-0">
                <div className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                  上课时间：<span className="font-medium text-foreground">{daysOfWeek.find(d => d.value === dayOfWeek)?.label} {TIME_SLOTS.find(s => s.id === selectedSlot)?.startTime} - {TIME_SLOTS.find(s => s.id === selectedSlot)?.endTime}</span>
                </div>
              </div>
            </div>
          </div>

          {isAssistant && !classData && (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
              <input
                type="checkbox"
                id="syncToTeacher"
                checked={syncToTeacher}
                onChange={(e) => setSyncToTeacher(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
              />
              <label htmlFor="syncToTeacher" className="text-sm text-foreground cursor-pointer select-none">
                同步至老师班级管理
              </label>
              <span className="text-xs text-muted-foreground ml-auto">同步后老师将收到通知</span>
            </div>
          )}

        </div>

        {/* 按钮区域 - 固定在底部，始终可见，flex-shrink-0确保不被压缩 */}
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
              disabled={!name.trim() || saving}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium shadow-sm"
            >
              {saving ? '保存中...' : classData ? '保存修改' : '创建班级'}
            </button>
          </div>
        </div>
        </form>
      </div>
    </div>
    </>
  )
}
