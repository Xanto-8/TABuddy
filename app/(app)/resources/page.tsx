'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Archive, CheckSquare, BarChart3, ArrowLeft, RefreshCw,
  Maximize2, Minimize2, ChevronDown, ExternalLink, Download,
  Search, Loader2, BookOpen, Globe, FileType,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { PageContainer } from '@/components/ui/page-container'
import { Class } from '@/types'
import {
  ClassResource,
  getClasses,
  getResourcesByClass,
} from '@/lib/store'
import { useAutoClass, getAutoSelectedClassId } from '@/lib/use-auto-class'

type ActiveView = 'cards' | 'repository' | 'answers' | 'feedback'

const EMBED_URLS = {
  answers: 'https://yk3.gokuai.com/file/cuzf2dk5dq7a504q5aihq4zq44hbp57b#',
  feedback: 'https://il.xdf.cn/plus/calendar',
}

const CARDS = [
  {
    id: 'repository' as const,
    title: '班级仓库汇总',
    description: '查看并管理所有班级的资源仓库，支持预览与下载',
    icon: Archive,
    gradient: 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'answers' as const,
    title: '加油站批改答案',
    description: '内嵌批改答案网页，支持全屏/小窗口切换，快速查看答案',
    icon: CheckSquare,
    gradient: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
    border: 'border-green-200 dark:border-green-800',
    iconBg: 'bg-green-100 dark:bg-green-900/50',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  {
    id: 'feedback' as const,
    title: '学情反馈中心',
    description: '快速查看学生学情数据与反馈记录，一站式掌握学习动态',
    icon: BarChart3,
    gradient: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
]

export default function ResourcesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [activeView, setActiveView] = useState<ActiveView>('cards')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [resources, setResources] = useState<ClassResource[]>([])
  const [resourcesLoading, setResourcesLoading] = useState(false)
  const [isClassSelectOpen, setIsClassSelectOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingTarget, setLoadingTarget] = useState<string | null>(null)
  const [openModes, setOpenModes] = useState<Record<string, 'embed' | 'tab'>>({
    answers: 'embed',
    feedback: 'embed',
  })
  const classSelectRef = useRef<HTMLDivElement>(null)
  const { teachingClassId, isTeachingClass, saveManualSelection } = useAutoClass(classes)
  const iframeRefs = useRef<{ answers?: HTMLIFrameElement; feedback?: HTMLIFrameElement }>({})

  useEffect(() => {
    const loadedClasses = getClasses()
    setClasses(loadedClasses)
    if (loadedClasses.length > 0) {
      const initialId = getAutoSelectedClassId(loadedClasses) || loadedClasses[0].id
      setSelectedClassId(initialId)
    }
  }, [])

  useEffect(() => {
    if (selectedClassId && activeView === 'repository') {
      setResourcesLoading(true)
      const res = getResourcesByClass(selectedClassId)
      setResources(res)
      setResourcesLoading(false)
    }
  }, [selectedClassId, activeView])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (classSelectRef.current && !classSelectRef.current.contains(event.target as Node)) {
        setIsClassSelectOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedClass = classes.find(c => c.id === selectedClassId)
  const isEmbeddedView = activeView === 'answers' || activeView === 'feedback'

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      document: '📄',
      link: '🔗',
      file: '📁',
      image: '🖼️',
      other: '📎',
    }
    return icons[type] || '📄'
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      document: '文档',
      link: '链接',
      file: '文件',
      image: '图片',
      other: '其他',
    }
    return labels[type] || '其他'
  }

  const handleRefresh = () => {
    const key = activeView as 'answers' | 'feedback'
    const iframe = iframeRefs.current[key]
    if (iframe) {
      iframe.src = EMBED_URLS[key]
      toast.success('已刷新页面')
    }
  }

  const handleGoBack = () => {
    setIsFullscreen(false)
    setActiveView('cards')
  }

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId)
    saveManualSelection(classId)
    setIsClassSelectOpen(false)
  }

  const handleCardClick = (cardId: 'repository' | 'answers' | 'feedback') => {
    if (cardId === 'repository') {
      setActiveView('repository')
      return
    }
    if (openModes[cardId] === 'tab') {
      window.open(EMBED_URLS[cardId], '_blank', 'noopener,noreferrer')
      return
    }
    setIsLoading(true)
    setLoadingTarget(cardId === 'answers' ? '加油站批改答案' : '学情反馈中心')
    setTimeout(() => {
      setActiveView(cardId)
      setTimeout(() => setIsLoading(false), 300)
    }, 400)
  }

  const toggleOpenMode = (e: React.MouseEvent, cardId: string) => {
    e.stopPropagation()
    setOpenModes(prev => ({
      ...prev,
      [cardId]: prev[cardId] === 'embed' ? 'tab' : 'embed',
    }))
    const modeName = openModes[cardId] === 'embed' ? '新标签页' : '内嵌'
    const cardTitle = cardId === 'answers' ? '加油站批改答案' : '学情反馈中心'
    toast.success(`${cardTitle} 已切换为「${modeName}」打开`)
  }

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div className="flex items-center gap-3">
        {activeView !== 'cards' && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={handleGoBack}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </motion.button>
        )}
        <div className="p-2.5 rounded-xl bg-primary/10">
          <BookOpen className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">资源容器</h1>
          <p className="text-sm text-muted-foreground">
            {activeView === 'cards' && '教学资源统一汇总入口'}
            {activeView === 'repository' && '班级资源仓库管理'}
            {activeView === 'answers' && '加油站批改答案'}
            {activeView === 'feedback' && '学情反馈中心'}
          </p>
        </div>
      </div>
      {isEmbeddedView && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent transition-all"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            刷新
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="inline-flex items-center px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent transition-all"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4 mr-1.5" />
            ) : (
              <Maximize2 className="h-4 w-4 mr-1.5" />
            )}
            {isFullscreen ? '退出全屏' : '全屏'}
          </button>
        </div>
      )}
    </div>
  )

  const renderCardGrid = () => (
    <motion.div
      key="cards"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {CARDS.map((card, index) => (
        <motion.button
          key={card.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.08 }}
          onClick={() => handleCardClick(card.id)}
          className={cn(
            'relative p-6 rounded-xl border text-left transition-all duration-300 cursor-pointer',
            'hover:shadow-2xl hover:-translate-y-1.5 hover:scale-[1.02]',
            'active:scale-[0.98] active:shadow-lg',
            'bg-gradient-to-br',
            card.gradient,
            card.border,
          )}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={cn(
              'p-3 rounded-xl',
              card.iconBg,
            )}>
              <card.icon className={cn('h-6 w-6', card.iconColor)} />
            </div>
            {card.id === 'repository' ? (
              <Globe className="h-4 w-4 text-muted-foreground/40" />
            ) : (
              <button
                onClick={(e) => toggleOpenMode(e, card.id)}
                className={cn(
                  'p-1 rounded-md transition-all',
                  openModes[card.id] === 'tab'
                    ? 'text-primary bg-primary/10 hover:bg-primary/20'
                    : 'text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent/50'
                )}
                title={openModes[card.id] === 'embed' ? '切换为新标签页打开' : '切换为内嵌打开'}
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            )}
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{card.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
        </motion.button>
      ))}
    </motion.div>
  )

  const renderRepositoryView = () => (
    <motion.div
      key="repository"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/50">
            <Archive className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">班级仓库汇总</h2>
            <p className="text-sm text-muted-foreground">选择班级查看对应资源</p>
          </div>
        </div>
        <div className="relative" ref={classSelectRef}>
          <button
            onClick={() => setIsClassSelectOpen(!isClassSelectOpen)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border',
              'text-sm font-medium text-foreground bg-background',
              'hover:bg-accent transition-all',
              isClassSelectOpen && 'bg-accent border-primary/50'
            )}
          >
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span>
              {selectedClass?.name || '选择班级'}
              {selectedClass && isTeachingClass(selectedClass.id) && (
                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">正在上课</span>
              )}
            </span>
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isClassSelectOpen && 'rotate-180')} />
          </button>
          <AnimatePresence>
            {isClassSelectOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full right-0 mt-1 z-50 min-w-[200px]"
              >
                <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-2xl overflow-hidden">
                  <div className="py-1">
                    {classes.map((cls) => (
                      <button
                        key={cls.id}
                        onClick={() => handleClassChange(cls.id)}
                        className={cn(
                          'w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-accent',
                          cls.id === selectedClassId
                            ? 'text-primary font-medium bg-primary/5'
                            : 'text-foreground'
                        )}
                      >
                        <span>
                          {cls.name}
                          {isTeachingClass(cls.id) && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">正在上课</span>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {resourcesLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : resources.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center py-20"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Archive className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">仓库为空</h3>
          <p className="text-muted-foreground">
            {selectedClass?.name || '该班级'} 暂无资源，请在班级管理中上传
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {resources.map((resource, index) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="group relative flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/30 hover:scale-[1.02] transition-all duration-300 ease-out"
            >
              <div className="p-2.5 rounded-lg bg-primary/5 shrink-0">
                <span className="text-xl">{getTypeIcon(resource.type)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-foreground truncate">
                      {resource.title}
                    </h4>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                      {getTypeLabel(resource.type)}
                    </span>
                  </div>
                </div>
                {resource.description && (
                  <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                    {resource.description}
                  </p>
                )}
                {resource.fileName ? (
                  <a
                    href={resource.url}
                    download={resource.originalName || resource.fileName}
                    className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <Download className="h-3 w-3" />
                    <span className="truncate max-w-[200px]">{resource.fileName}</span>
                  </a>
                ) : (
                  resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span className="truncate max-w-[200px]">{resource.url}</span>
                    </a>
                  )
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )

  const renderEmbeddedView = (type: 'answers' | 'feedback') => (
    <motion.div
      key={type}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col',
        isFullscreen ? 'fixed inset-0 z-[100] bg-background p-4' : 'flex-1'
      )}
    >
      <div className={cn(
        'flex-1 rounded-xl border border-border overflow-hidden bg-card',
        'flex flex-col'
      )}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className={cn(
              'p-1.5 rounded-lg',
              type === 'answers'
                ? 'bg-green-100 dark:bg-green-900/50'
                : 'bg-amber-100 dark:bg-amber-900/50'
            )}>
              {type === 'answers' ? (
                <CheckSquare className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <BarChart3 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <span className="text-sm font-medium text-foreground">
              {type === 'answers' ? '加油站批改答案' : '学情反馈中心'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const iframe = iframeRefs.current[type]
                if (iframe) {
                  iframe.src = EMBED_URLS[type]
                  toast.success('已刷新页面')
                }
              }}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              title="刷新"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              title={isFullscreen ? '退出全屏' : '全屏'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            {!isFullscreen && (
              <button
                onClick={handleGoBack}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                title="返回"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            {isFullscreen && (
              <button
                onClick={() => { setIsFullscreen(false); setActiveView('cards') }}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                title="关闭"
              >
                <Maximize2 className="h-4 w-4 rotate-45" />
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 relative bg-white">
          <iframe
            ref={(el) => { if (el) iframeRefs.current[type] = el }}
            src={EMBED_URLS[type]}
            className="absolute inset-0 w-full h-full border-0"
            title={type === 'answers' ? '加油站批改答案' : '学情反馈中心'}
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
          />
        </div>
      </div>
    </motion.div>
  )

  return (
    <PageContainer>
      <div className="space-y-6">
        {renderHeader()}

        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-32"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl animate-pulse" />
              <Loader2 className="relative h-10 w-10 animate-spin text-primary" />
            </div>
            <p className="mt-6 text-base font-medium text-foreground">正在打开 {loadingTarget}...</p>
            <p className="mt-2 text-sm text-muted-foreground">请稍候，即将加载内容</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {activeView === 'cards' && renderCardGrid()}
            {activeView === 'repository' && renderRepositoryView()}
            {activeView === 'answers' && renderEmbeddedView('answers')}
            {activeView === 'feedback' && renderEmbeddedView('feedback')}
          </AnimatePresence>
        )}
        </div>
      </PageContainer>
  )
}
