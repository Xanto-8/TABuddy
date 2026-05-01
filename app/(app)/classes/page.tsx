'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Users, MoreHorizontal, Pencil, Trash2, BookOpen, Home, Clock, Calendar, X, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Class, ClassType, ClassSchedule } from '@/types'
import { getClasses, deleteClass, getClassTypeLabel, getClassTypeColor } from '@/lib/store'
import { cn } from '@/lib/utils'
import { PageContainer } from '@/components/ui/page-container'
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
  const { isAssistant, isClassAdmin } = useRoleAccess()
  const [classes, setClasses] = useState<Class[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const canEdit = isClassAdmin || user?.role === 'superadmin'

  useEffect(() => {
    setClasses(getClasses())
  }, [])

  const refreshClasses = () => {
    setClasses(getClasses())
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
                  <span>{formatScheduleDisplay(cls.schedules)}</span>
                </div>

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
}: {
  classData: Class | null
  onClose: () => void
  onSave: () => void
  isOpen: boolean
}) {
  const [name, setName] = useState(classData?.name || '')
  const [type, setType] = useState<ClassType>(classData?.type || 'OTHER')
  const [description, setDescription] = useState(classData?.description || '')
  const [saving, setSaving] = useState(false)
  const [isSelectOpen, setIsSelectOpen] = useState(false)
  const [dayOfWeek, setDayOfWeek] = useState<number>(1) // 1=周一
  const [startTime, setStartTime] = useState<string>('09:00')
  const [endTime, setEndTime] = useState<string>('10:30')
  const [isDaySelectOpen, setIsDaySelectOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)
  const daySelectRef = useRef<HTMLDivElement>(null)
  const modalContentRef = useRef<HTMLDivElement>(null)

  // 编辑模式时，从已有班级数据加载上课时间
  useEffect(() => {
    if (classData && classData.schedules && classData.schedules.length > 0) {
      const s = classData.schedules[0]
      setDayOfWeek(s.dayOfWeek)
      setStartTime(s.startTime)
      setEndTime(s.endTime)
    } else {
      setDayOfWeek(1)
      setStartTime('09:00')
      setEndTime('10:30')
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

  // 时间选择器 - 时/分双列滚轮，5分钟步长，确定/取消模式
  // 核心设计：滚动永不触发关闭或值更新，只有点击「确定」才回填值
  const TimePicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false)
    const panelRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const hoursRef = useRef<HTMLDivElement>(null)
    const minutesRef = useRef<HTMLDivElement>(null)

    // 内部暂存选中值，确定后才回填到父组件
    const [tempHour, setTempHour] = useState(() => value.split(':')[0] || '00')
    const [tempMinute, setTempMinute] = useState(() => {
      const m = parseInt(value.split(':')[1] || '0')
      return (Math.round(m / 5) * 5).toString().padStart(2, '0')
    })

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
    const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'))
    const itemHeight = 36

    // 打开时同步暂存值并滚动到选中项
    useEffect(() => {
      if (isOpen) {
        const h = value.split(':')[0] || '00'
        const m = parseInt(value.split(':')[1] || '0')
        const roundedM = (Math.round(m / 5) * 5).toString().padStart(2, '0')
        setTempHour(h)
        setTempMinute(roundedM)
        requestAnimationFrame(() => {
          if (hoursRef.current) {
            const idx = hours.indexOf(h)
            hoursRef.current.scrollTop = Math.max(0, idx) * itemHeight
          }
          if (minutesRef.current) {
            const idx = minutes.indexOf(roundedM)
            minutesRef.current.scrollTop = Math.max(0, idx) * itemHeight
          }
        })
      }
    }, [isOpen])

    // 点击外部关闭 - 使用 mousedown 事件，与滚动事件无冲突
    useEffect(() => {
      if (!isOpen) return
      const handleMouseDown = (e: MouseEvent) => {
        if (
          panelRef.current &&
          !panelRef.current.contains(e.target as Node) &&
          triggerRef.current &&
          !triggerRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false)
        }
      }
      document.addEventListener('mousedown', handleMouseDown)
      return () => document.removeEventListener('mousedown', handleMouseDown)
    }, [isOpen])

    // 滚动停止后更新暂存值（仅更新内部状态，不触发父组件 onChange）
    const handleScrollStop = (container: HTMLDivElement | null, items: string[], setter: (v: string) => void) => {
      if (!container) return
      const index = Math.round(container.scrollTop / itemHeight)
      const clampedIndex = Math.max(0, Math.min(items.length - 1, index))
      setter(items[clampedIndex])
    }

    // 使用 ref 存储定时器，避免闭包问题
    const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const handleScroll = (container: HTMLDivElement | null, items: string[], setter: (v: string) => void) => {
      if (!container) return
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
      scrollTimerRef.current = setTimeout(() => handleScrollStop(container, items, setter), 150)
    }

    const handleConfirm = () => {
      onChange(`${tempHour}:${tempMinute}`)
      setIsOpen(false)
    }

    const handleCancel = () => {
      setIsOpen(false)
    }

    const displayValue = value

    return (
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 sm:py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm flex items-center justify-between cursor-pointer hover:bg-accent/50 backdrop-blur-sm font-mono tracking-wider"
        >
          <span>{displayValue}</span>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </button>

        {isOpen && (
          <div
            ref={panelRef}
            className="absolute bottom-full left-0 right-0 mb-1 z-50"
          >
            <div className="rounded-2xl border border-border bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden">
              {/* 滚轮区域 */}
              <div className="p-3 pb-2">
                <div className="flex gap-2">
                  {/* 小时列 */}
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground text-center mb-1 font-medium">时</div>
                    <div
                      ref={hoursRef}
                      onScroll={() => handleScroll(hoursRef.current, hours, setTempHour)}
                      className="h-[180px] overflow-y-auto scrollbar-thin select-none [&::-webkit-scrollbar]:w-1"
                    >
                      <div className="h-[72px] flex-shrink-0" />
                      {hours.map((h) => (
                        <div
                          key={h}
                          onClick={() => {
                            setTempHour(h)
                            if (hoursRef.current) {
                              const idx = hours.indexOf(h)
                              hoursRef.current.scrollTop = idx * itemHeight
                            }
                          }}
                          className={`h-9 flex items-center justify-center text-sm cursor-pointer transition-colors rounded-lg mx-1 ${
                            tempHour === h
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'text-foreground hover:bg-accent'
                          }`}
                        >
                          {h}
                        </div>
                      ))}
                      <div className="h-[72px] flex-shrink-0" />
                    </div>
                  </div>

                  {/* 分隔符 */}
                  <div className="flex items-center justify-center text-lg text-muted-foreground font-medium pt-5">:</div>

                  {/* 分钟列 */}
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground text-center mb-1 font-medium">分</div>
                    <div
                      ref={minutesRef}
                      onScroll={() => handleScroll(minutesRef.current, minutes, setTempMinute)}
                      className="h-[180px] overflow-y-auto scrollbar-thin select-none [&::-webkit-scrollbar]:w-1"
                    >
                      <div className="h-[72px] flex-shrink-0" />
                      {minutes.map((m) => (
                        <div
                          key={m}
                          onClick={() => {
                            setTempMinute(m)
                            if (minutesRef.current) {
                              const idx = minutes.indexOf(m)
                              minutesRef.current.scrollTop = idx * itemHeight
                            }
                          }}
                          className={`h-9 flex items-center justify-center text-sm cursor-pointer transition-colors rounded-lg mx-1 ${
                            tempMinute === m
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'text-foreground hover:bg-accent'
                          }`}
                        >
                          {m}
                        </div>
                      ))}
                      <div className="h-[72px] flex-shrink-0" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 确定/取消按钮 */}
              <div className="flex items-center justify-end gap-2 px-3 pb-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="px-4 py-1.5 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors rounded-lg"
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }



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

    try {
      if (classData) {
        const { updateClass, saveClassSchedule, getClassSchedules, updateClassSchedule, deleteClassSchedule } = await import('@/lib/store')
        updateClass(classData.id, { name: name.trim(), type, description: description.trim() || undefined })
        
        // 保存上课时间
        if (dayOfWeek !== undefined && startTime && endTime) {
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
        const newClass = saveClass({ name: name.trim(), type, description: description.trim() || undefined })
        
        // 保存上课时间
        if (newClass && dayOfWeek && startTime && endTime) {
          saveClassSchedule({
            classId: newClass.id,
            dayOfWeek,
            startTime,
            endTime,
          })
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
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
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

                {/* 开始时间 */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    开始时间
                  </label>
                  <TimePicker value={startTime} onChange={setStartTime} />
                </div>

                {/* 结束时间 */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    结束时间
                  </label>
                  <TimePicker value={endTime} onChange={setEndTime} />
                </div>
              </div>

              {/* 时间预览 */}
              <div className="pt-2 min-w-0">
                <div className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                  上课时间：<span className="font-medium text-foreground">{daysOfWeek.find(d => d.value === dayOfWeek)?.label} {startTime} - {endTime}</span>
                </div>
              </div>
            </div>
          </div>


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
