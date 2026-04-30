'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageContainer } from '@/components/ui/page-container'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { submitFeedback } from '@/lib/feedback-store'
import { FeedbackType } from '@/types'
import {
  Search, LayoutDashboard, GitBranch, GraduationCap, FileText,
  ClipboardList, MessageSquare, BookOpen, Settings, ChevronRight,
  Bug, Lightbulb, Paperclip, Send, CheckCircle, X, HelpCircle,
} from 'lucide-react'

type Tab = 'help' | 'feedback'

const HELP_MODULES = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    label: '仪表盘',
    color: 'from-blue-500 to-cyan-400',
    items: [
      { title: '数据统计总览', content: '仪表盘顶部显示您管理的班级总数、今日有课班级数、待完成任务数，让您对当日工作一目了然。' },
      { title: '班级待办中心', content: '按班级列出所有待处理事项，包括作业待批改数、测验待记录数、任务待完成数。点击班级可跳转到班级详情页进行具体操作。' },
      { title: '课程表与考勤', content: '支持今日/本周/本月三种视图切换。今日视图显示当前正在上课的班级和剩余时间；本周/本月视图以日历形式展示所有课程安排，支持标记调课或停课日期。' },
      { title: '班级学习概览', content: '折线图展示各班级的正确率变化趋势，可切换查看所有班级平均或单个班级数据。' },
      { title: '快捷入口', content: '一键跳转到班级管理、作业管理、随堂测验、反馈管理、教学资源等功能页面。' },
      { title: '工作统计', content: '统计今日各类型任务的完成情况，显示已完成和待完成的任务数量。' },
    ],
  },
  {
    id: 'workflow',
    icon: GitBranch,
    label: '我的工作流',
    color: 'from-purple-500 to-pink-400',
    items: [
      { title: '什么是工作流', content: '工作流是您为每种课程类型（GY、KET、PET等）定义的标准教学流程，系统会据此自动生成每日待办事项。' },
      { title: '编辑工作流模板', content: '进入工作流页面后，选择要编辑的课程类型，您可以添加、删除、启用/禁用任务节点，也可以调整节点的执行顺序。' },
      { title: '自定义节点', content: '您可以创建自定义名称和图标的节点，满足个性化的教学需求。自定义节点不受系统限制。' },
      { title: '创建自定义模板', content: '基于现有课程类型创建全新的工作流模板，自由配置所有节点。' },
      { title: '待办事项自动生成', content: '系统会根据班级的课程类型匹配对应的工作流模板，在每个上课日自动生成待办事项。您只需要在仪表盘中标记完成即可。' },
      { title: '重置模板', content: '如果不小心修改了系统模板，可以一键重置为默认配置。' },
    ],
  },
  {
    id: 'classes',
    icon: GraduationCap,
    label: '班级管理',
    color: 'from-green-500 to-emerald-400',
    items: [
      { title: '创建班级', content: '在班级管理页面点击「创建班级」，填写班级名称并选择班级类型（GY/KET/PET/FCE等），即可创建一个新班级。' },
      { title: '班级类型设置', content: '系统内置 GY、KET、PET、FCE、CAE、CPE 等常见课程类型，您也可以在设置中自定义添加班级类型。' },
      { title: '上课时间管理', content: '进入班级详情页，添加每周的上课时间段（星期几+开始时间+结束时间）。系统会根据上课时间自动判断当前是否有课。' },
      { title: '课程任务管理', content: '为班级创建课程任务模板，系统会在每个上课日自动生成任务实例。支持标记任务完成状态，自动统计进度。' },
      { title: '课时进度管理', content: '系统自动记录每个班级的上课课时，支持手动调整课时进度。' },
      { title: '学生管理', content: '在班级详情页可以查看该班学生列表，添加或移除学生，标记重点关注学生。' },
    ],
  },
  {
    id: 'homework',
    icon: FileText,
    label: '作业管理',
    color: 'from-orange-500 to-yellow-400',
    items: [
      { title: '记录作业评估', content: '选择班级和学生，填写评估数据。评估维度包括完成度（Completion）、正确率（Accuracy）和书写质量（Handwriting）。' },
      { title: '添加评语', content: '支持手动输入评语，也可以使用系统自动生成的评语模板，提高工作效率。' },
      { title: '查看作业记录', content: '按班级筛选查看所有作业记录，评分数据会同步到仪表盘的班级待办中心。' },
      { title: '导出数据', content: '支持将作业评估数据导出为 Excel 或 Word 文档，方便存档或发送给家长。' },
    ],
  },
  {
    id: 'quizzes',
    icon: ClipboardList,
    label: '随堂测验',
    color: 'from-red-500 to-rose-400',
    items: [
      { title: '记录测验成绩', content: '选择班级和学生，填写测验数据。记录内容包括完成情况、单词成绩（Word Score / Word Total）和整体正确率。' },
      { title: '重测管理', content: '支持录入重测名单，追踪重测学生的进步情况，更新小测完成状态。' },
      { title: '班级整体正确率', content: '系统根据所有测验数据自动计算班级整体正确率，并在仪表盘的学习概览图表中展示变化趋势。' },
      { title: '导出数据', content: '支持将测验数据导出为 Excel 或 Word 文档，便于分析和管理。' },
    ],
  },
  {
    id: 'feedback',
    icon: MessageSquare,
    label: '反馈管理',
    color: 'from-teal-500 to-cyan-400',
    items: [
      { title: '查看反馈历史', content: '按学生或班级筛选查看所有课程反馈记录。' },
      { title: '生成反馈', content: '选择学生后，系统支持自动生成评语，您也可以手动修改或补充反馈内容。' },
      { title: '反馈模板', content: '系统预置了课程反馈模板，您可以在知识库中查看和使用。支持自定义反馈内容。' },
      { title: '导出反馈', content: '支持将反馈数据导出为 Word 文档，可用于发送给家长或存档。' },
    ],
  },
  {
    id: 'knowledge',
    icon: BookOpen,
    label: '知识库管理',
    color: 'from-indigo-500 to-violet-400',
    items: [
      { title: '私有知识库', content: '您个人的知识库，包含操作指南和常用模板。支持添加、编辑、删除知识条目。条目类型包括链接、模板、文档和信息。' },
      { title: '公共知识库（管理员）', content: '管理员专属功能。由管理员维护，所有用户共享。支持启用/禁用条目，数据同步到服务器。' },
      { title: '智能匹配', content: 'AI 助手的知识问答功能会先在本地知识库中匹配，无匹配时自动查询公共知识库。匹配基于关键词和优先级打分排序。' },
      { title: '重置知识库', content: '如果不小心修改了默认知识库，可以一键重置为系统预置的默认条目。' },
    ],
  },
  {
    id: 'settings',
    icon: Settings,
    label: '设置',
    color: 'from-slate-500 to-gray-400',
    items: [
      { title: '个人信息修改', content: '在设置页可以修改头像（点击上传图片）、显示名称和所属机构。修改后自动保存，右上角头像实时更新。' },
      { title: '深色/浅色模式', content: '在设置页或侧边栏底部可切换系统主题。深色模式适合暗光环境，浅色模式适合明亮环境。' },
      { title: '消息通知设置', content: '开启或关闭各类通知，包括助手消息、班级提醒、作业提醒。' },
      { title: '数据备份与恢复', content: '支持将所有数据导出为 JSON 文件保存到电脑，也可以从备份文件恢复数据。可在不同电脑间迁移数据。' },
    ],
  },
]

const FEEDBACK_TYPE_OPTIONS: { value: FeedbackType; label: string; icon: typeof Bug }[] = [
  { value: 'bug', label: 'Bug 反馈', icon: Bug },
  { value: 'suggestion', label: '功能建议', icon: Lightbulb },
  { value: 'other', label: '其他', icon: HelpCircle },
]

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState<Tab>('help')
  const [search, setSearch] = useState('')
  const [expandedModule, setExpandedModule] = useState<string | null>(null)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug')
  const [feedbackDesc, setFeedbackDesc] = useState('')
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredModules = HELP_MODULES.map((mod) => ({
    ...mod,
    items: mod.items.filter(
      (item) =>
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.content.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((mod) => mod.items.length > 0)

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片不能超过 5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setScreenshot(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmitFeedback = () => {
    if (!feedbackDesc.trim()) {
      toast.error('请描述您的问题或建议')
      return
    }
    if (feedbackDesc.length > 1000) {
      toast.error('描述内容不能超过1000字')
      return
    }
    setSubmitting(true)
    setTimeout(() => {
      submitFeedback(feedbackType, feedbackDesc.trim(), screenshot || undefined)
      setSubmitting(false)
      setSubmitted(true)
      toast.success('反馈提交成功！预计1-3个工作日内回复')
    }, 600)
  }

  if (submitted) {
    return (
      <PageContainer>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => {
                setSubmitted(false)
                setActiveTab('feedback')
                setFeedbackDesc('')
                setScreenshot(null)
                setFeedbackType('bug')
              }}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="h-5 w-5 rotate-180" />
            </button>
            <h1 className="text-2xl font-bold text-foreground">帮助与反馈</h1>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">感谢您的反馈！</h2>
            <p className="text-muted-foreground mb-2 max-w-md">
              您的意见对我们非常重要，我们会认真查看每一条反馈。
            </p>
            <p className="text-sm text-muted-foreground/70 mb-8">预计回复时间：1-3个工作日</p>
            <Button
              onClick={() => {
                setSubmitted(false)
                setActiveTab('help')
                setFeedbackDesc('')
                setScreenshot(null)
              }}
              variant="outline"
            >
              返回帮助中心
            </Button>
          </motion.div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <HelpCircle className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">帮助与反馈</h1>
            <p className="text-sm text-muted-foreground">了解系统功能，提交问题或建议</p>
          </div>
        </div>

        <div className="flex border-b border-border mb-6">
          <button
            onClick={() => setActiveTab('help')}
            className={cn(
              'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'help'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            帮助指南
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={cn(
              'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'feedback'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            反馈建议
          </button>
        </div>

        {activeTab === 'help' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索帮助内容..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setExpandedModule(null)
                  setExpandedItem(null)
                }}
                className="pl-10"
              />
            </div>

            {filteredModules.length === 0 ? (
              <div className="text-center py-16">
                <Search className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">未找到相关帮助内容</p>
                <p className="text-sm text-muted-foreground/60 mt-1">试试其他关键词</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredModules.map((mod) => (
                  <motion.div
                    key={mod.id}
                    layout
                    className="rounded-xl border border-border bg-card overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                      className="w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors text-left"
                    >
                      <div className={cn('w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0', mod.color)}>
                        <mod.icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm">{mod.label}</p>
                        <p className="text-xs text-muted-foreground">{mod.items.length} 条帮助</p>
                      </div>
                      <ChevronRight
                        className={cn(
                          'h-4 w-4 text-muted-foreground transition-transform shrink-0',
                          expandedModule === mod.id && 'rotate-90'
                        )}
                      />
                    </button>

                    <AnimatePresence>
                      {expandedModule === mod.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden border-t border-border"
                        >
                          <div className="divide-y divide-border">
                            {mod.items.map((item) => (
                              <div key={item.title}>
                                <button
                                  onClick={() =>
                                    setExpandedItem(expandedItem === item.title ? null : item.title)
                                  }
                                  className="w-full flex items-center gap-2 px-4 py-3 hover:bg-accent/30 transition-colors text-left"
                                >
                                  <ChevronRight
                                    className={cn(
                                      'h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0',
                                      expandedItem === item.title && 'rotate-90'
                                    )}
                                  />
                                  <span className="text-sm text-foreground">{item.title}</span>
                                </button>
                                <AnimatePresence>
                                  {expandedItem === item.title && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.15 }}
                                      className="overflow-hidden"
                                    >
                                      <p className="px-4 pb-3 text-sm text-muted-foreground leading-relaxed">
                                        {item.content}
                                      </p>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'feedback' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-2xl"
          >
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">提交反馈</h2>
              <p className="text-sm text-muted-foreground mb-6">
                遇到问题或有好的建议？告诉我们，我们会尽快处理。
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">问题类型</label>
                  <div className="flex gap-3">
                    {FEEDBACK_TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFeedbackType(opt.value)}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm transition-colors',
                          feedbackType === opt.value
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent/50'
                        )}
                      >
                        <opt.icon className="h-4 w-4" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    问题描述 <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    value={feedbackDesc}
                    onChange={(e) => setFeedbackDesc(e.target.value)}
                    placeholder="请详细描述您遇到的问题或建议..."
                    rows={5}
                    maxLength={1000}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-colors"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">{feedbackDesc.length}/1000</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    上传截图 <span className="text-muted-foreground/60 text-xs">（选填，不超过 5MB）</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotUpload}
                    className="hidden"
                  />
                  {screenshot ? (
                    <div className="relative inline-block rounded-lg overflow-hidden border border-border">
                      <img src={screenshot} alt="截图预览" className="max-h-48 rounded-lg" />
                      <button
                        onClick={() => setScreenshot(null)}
                        className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors w-full"
                    >
                      <Paperclip className="h-4 w-4" />
                      点击上传截图
                    </button>
                  )}
                </div>

                <Button
                  onClick={handleSubmitFeedback}
                  disabled={submitting || !feedbackDesc.trim()}
                  className="w-full"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      提交中...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      提交反馈
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </PageContainer>
  )
}
