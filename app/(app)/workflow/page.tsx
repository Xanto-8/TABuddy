'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GitBranch, Info, Plus, X,
} from 'lucide-react'
import type { ClassType } from '@/types'
import { PageContainer } from '@/components/ui/page-container'
import { WorkflowCanvas } from '@/components/workflow/workflow-canvas'
import {
  getAllCustomTemplates,
  createCustomWorkflowTemplate,
  deleteWorkflowTemplate,
} from '@/lib/workflow-store'
import { cn } from '@/lib/utils'

const COURSE_TABS: { type: ClassType; label: string; desc: string }[] = [
  { type: 'GY', label: 'GY', desc: 'GY 课程体系' },
  { type: 'KET', label: 'KET', desc: 'KET 课程体系' },
  { type: 'PET', label: 'PET', desc: 'PET 课程体系' },
  { type: 'FCE', label: 'FCE', desc: 'FCE 课程体系' },
  { type: 'OTHER', label: '其他', desc: '通用工作流' },
]

const COURSE_OPTIONS: { type: ClassType; label: string }[] = [
  { type: 'GY', label: 'GY' },
  { type: 'KET', label: 'KET' },
  { type: 'PET', label: 'PET' },
  { type: 'FCE', label: 'FCE' },
  { type: 'OTHER', label: '其他' },
]

export default function WorkflowPage() {
  const [activeKey, setActiveKey] = useState<string>('GY')
  const [templateVersion, setTemplateVersion] = useState(0)
  const [customTemplates, setCustomTemplates] = useState(getAllCustomTemplates())
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createCourse, setCreateCourse] = useState<ClassType>('GY')

  const refreshCustomTemplates = useCallback(() => {
    setCustomTemplates(getAllCustomTemplates())
  }, [])

  const isSystemTab = COURSE_TABS.some((t) => t.type === activeKey)

  const handleTemplateChange = useCallback(() => {
    setTemplateVersion((v) => v + 1)
    refreshCustomTemplates()
  }, [refreshCustomTemplates])

  const handleCreateWorkflow = useCallback(() => {
    if (!createName.trim()) return
    const newTemplate = createCustomWorkflowTemplate(createName.trim(), createCourse)
    refreshCustomTemplates()
    setActiveKey(newTemplate.id)
    setShowCreateModal(false)
    setCreateName('')
    setCreateCourse('GY')
  }, [createName, createCourse, refreshCustomTemplates])

  const handleDeleteCustomTab = useCallback((e: React.MouseEvent, templateId: string) => {
    e.stopPropagation()
    const template = customTemplates.find((t) => t.id === templateId)
    if (!template) return
    const confirmed = window.confirm(`确定要删除工作流「${template.name}」吗？此操作不可恢复。`)
    if (!confirmed) return
    deleteWorkflowTemplate(templateId)
    refreshCustomTemplates()
    if (activeKey === templateId) {
      setActiveKey('GY')
    }
  }, [customTemplates, activeKey, refreshCustomTemplates])

  const activeTemplate = isSystemTab
    ? null
    : customTemplates.find((t) => t.id === activeKey) || null

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-sm">
                <GitBranch size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">我的工作流</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  为不同课程体系配置课中工作流程，自动同步至班级待办中心
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold
                text-white bg-gradient-to-r from-indigo-500 to-purple-500
                hover:from-indigo-600 hover:to-purple-600
                rounded-xl transition-all duration-200 shadow-sm"
            >
              <Plus size={16} />
              <span>新建工作流</span>
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 bg-indigo-50/70 border border-indigo-100 rounded-xl px-4 py-3">
            <Info size={15} className="text-indigo-400 flex-shrink-0" />
            <p className="text-xs text-indigo-600/80 leading-relaxed">
              每个课程体系拥有独立的工作流模板。开启/关闭节点、拖拽调整顺序后点击「保存」即可生效。
              保存后，仪表盘分班待办中心将自动同步更新。
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto">
            {COURSE_TABS.map((tab) => (
              <button
                key={tab.type}
                onClick={() => setActiveKey(tab.type)}
                title={`${tab.label} · ${tab.desc}`}
                className={cn(
                  'relative px-4 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap',
                  activeKey === tab.type
                    ? 'text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {tab.label}
                {activeKey === tab.type && (
                  <motion.div
                    layoutId="workflowTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full"
                  />
                )}
              </button>
            ))}
            {customTemplates.map((ct) => (
              <button
                key={ct.id}
                onClick={() => setActiveKey(ct.id)}
                title={`${ct.name} · ${ct.courseLabel || ''}`}
                className={cn(
                  'relative px-4 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap group',
                  activeKey === ct.id
                    ? 'text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span>{ct.name}</span>
                  <span
                    onClick={(e) => handleDeleteCustomTab(e, ct.id)}
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full
                      opacity-0 group-hover:opacity-100 transition-all
                      hover:bg-red-100 hover:text-red-500 text-gray-400 cursor-pointer"
                    title="删除此工作流"
                  >
                    <X size={10} />
                  </span>
                </div>
                {activeKey === ct.id && (
                  <motion.div
                    layoutId="workflowTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full"
                  />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeKey}-${templateVersion}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <WorkflowCanvas
              courseType={isSystemTab ? (activeKey as ClassType) : (activeTemplate?.courseType || 'OTHER')}
              templateOverride={activeTemplate}
              onTemplateChange={handleTemplateChange}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-[420px]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">新建工作流</h3>
                  <p className="text-sm text-gray-500 mt-0.5">创建自定义课中工作流模板</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">工作流名称</label>
                  <input
                    type="text"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="如：我的精简版、GY少儿专属"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800
                      placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300
                      transition-all"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">关联课程体系</label>
                  <div className="grid grid-cols-2 gap-2">
                    {COURSE_OPTIONS.map((opt) => (
                      <button
                        key={opt.type}
                        onClick={() => setCreateCourse(opt.type)}
                        className={cn(
                          'px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all text-left',
                          createCourse === opt.type
                            ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-xl transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateWorkflow}
                  disabled={!createName.trim()}
                  className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500
                    hover:from-indigo-600 hover:to-purple-600 rounded-xl transition-all shadow-sm
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  创建工作流
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  )
}
