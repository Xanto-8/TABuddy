'use client'

import React, { useState, useEffect } from 'react'
import {
  Settings, Globe, Copy, Check, X, Trash2, Plus,
  ExternalLink, AlertCircle, Save,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface TargetConfig {
  id: string
  name: string
  url: string
  selectors: Array<{
    id: string
    fieldName: string
    selector: string
    fieldType: 'text' | 'textarea' | 'select'
  }>
}

export default function AutoFillConfigPanel() {
  const [configs, setConfigs] = useState<TargetConfig[]>([])
  const [activeConfig, setActiveConfig] = useState<TargetConfig | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [newConfig, setNewConfig] = useState({
    name: '',
    url: '',
    selectors: [] as Array<{ id: string; fieldName: string; selector: string; fieldType: 'text' | 'textarea' | 'select' }>,
  })
  const [copiedScript, setCopiedScript] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('tabuddy_autofill_configs')
    if (saved) {
      try {
        setConfigs(JSON.parse(saved))
      } catch {
        setConfigs([])
      }
    }
  }, [])

  const saveConfigs = (newConfigs: TargetConfig[]) => {
    setConfigs(newConfigs)
    localStorage.setItem('tabuddy_autofill_configs', JSON.stringify(newConfigs))
  }

  const handleAddConfig = () => {
    if (!newConfig.name.trim() || !newConfig.url.trim()) {
      toast.error('请填写名称和网址')
      return
    }

    const config: TargetConfig = {
      id: Date.now().toString(),
      name: newConfig.name.trim(),
      url: newConfig.url.trim(),
      selectors: newConfig.selectors.filter((s) => s.fieldName.trim() && s.selector.trim()),
    }

    saveConfigs([...configs, config])
    setNewConfig({ name: '', url: '', selectors: [] })
    setIsAdding(false)
    toast.success('配置已保存')
  }

  const handleDeleteConfig = (id: string) => {
    if (!confirm('确定要删除这个配置吗？')) return
    saveConfigs(configs.filter((c) => c.id !== id))
    if (activeConfig?.id === id) {
      setActiveConfig(null)
    }
    toast.success('配置已删除')
  }

  const handleAddSelector = () => {
    setNewConfig((prev) => ({
      ...prev,
      selectors: [
        ...prev.selectors,
        { id: Date.now().toString(), fieldName: '', selector: '', fieldType: 'text' },
      ],
    }))
  }

  const handleUpdateSelector = (index: number, field: string, value: string | 'text' | 'textarea' | 'select') => {
    setNewConfig((prev) => {
      const selectors = [...prev.selectors]
      selectors[index] = { ...selectors[index], [field]: value }
      return { ...prev, selectors }
    })
  }

  const handleDeleteSelector = (index: number) => {
    setNewConfig((prev) => ({
      ...prev,
      selectors: prev.selectors.filter((_, i) => i !== index),
    }))
  }

  const handleCopyScript = async () => {
    const script = `// TABuddy 自动填写脚本
// 使用方法：在目标网页控制台粘贴此脚本，或创建书签执行

(function() {
  const feedbackData = window.tabuddyFeedbackData || ${JSON.stringify({
    students: [],
    timestamp: new Date().toISOString(),
  })};
  
  // 根据配置填写表单
  ${activeConfig?.selectors.map((sel) => `
  const ${sel.fieldName.replace(/\s+/g, '')}Element = document.querySelector('${sel.selector}');
  if (${sel.fieldName.replace(/\s+/g, '')}Element) {
    ${sel.fieldType === 'textarea' || sel.fieldType === 'text' 
      ? `${sel.fieldName.replace(/\s+/g, '')}Element.value = feedbackData.students[0]?.${sel.fieldName} || '';`
      : `${sel.fieldName.replace(/\s+/g, '')}Element.selectedIndex = 0;`
    }
  }
  `).join('\n')}
  
  console.log('TABuddy 自动填写完成');
})();
`

    try {
      await navigator.clipboard.writeText(script)
      setCopiedScript(true)
      toast.success('脚本已复制到剪贴板')
      setTimeout(() => setCopiedScript(false), 2000)
    } catch {
      toast.error('复制失败')
    }
  }

  const handleOpenTargetPage = () => {
    if (!activeConfig) return
    window.open(activeConfig.url, '_blank')
  }

  const generateAutoFillScript = (feedbacks: Record<string, string>) => {
    return `// TABuddy 自动填写脚本
window.tabuddyFeedbackData = ${JSON.stringify({
      students: Object.entries(feedbacks).map(([id, content]) => ({
        id,
        content,
      })),
      timestamp: new Date().toISOString(),
    })};

console.log('TABuddy 反馈数据已加载');
console.log('当前学生反馈:', window.tabuddyFeedbackData);
`
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-muted/30 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">自动化填写配置</h3>
          <p className="text-xs text-muted-foreground">配置目标网页，实现一键自动填写反馈</p>
        </div>
      </div>

      <div className="flex">
        <div className="w-64 border-r border-border p-4 space-y-2 max-h-[400px] overflow-y-auto">
          <button
            onClick={() => {
              setIsAdding(true)
              setIsEditing(false)
              setNewConfig({ name: '', url: '', selectors: [] })
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all text-sm"
          >
            <Plus className="h-4 w-4" />
            添加配置
          </button>

          {configs.map((config) => (
            <div
              key={config.id}
              className={cn(
                'p-3 rounded-lg cursor-pointer transition-all text-sm',
                activeConfig?.id === config.id
                  ? 'bg-primary/10 border border-primary/30'
                  : 'hover:bg-accent/50'
              )}
              onClick={() => {
                setActiveConfig(config)
                setIsAdding(false)
                setIsEditing(false)
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{config.name}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {config.url.length > 30 ? config.url.slice(0, 30) + '...' : config.url}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteConfig(config.id)
                  }}
                  className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50/50 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {configs.length === 0 && !isAdding && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>暂无配置</p>
              <p className="text-xs mt-1">点击上方添加目标网页配置</p>
            </div>
          )}
        </div>

        <div className="flex-1 p-4">
          <AnimatePresence mode="wait">
            {isAdding && (
              <motion.div
                key="add"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h4 className="text-sm font-medium text-foreground">添加新配置</h4>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    配置名称
                  </label>
                  <input
                    type="text"
                    value={newConfig.name}
                    onChange={(e) => setNewConfig((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="如：家校平台反馈页面"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    目标网址
                  </label>
                  <input
                    type="url"
                    value={newConfig.url}
                    onChange={(e) => setNewConfig((prev) => ({ ...prev, url: e.target.value }))}
                    placeholder="https://example.com/feedback"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      字段选择器配置
                    </label>
                    <button
                      onClick={handleAddSelector}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-primary hover:bg-primary/10 transition-all"
                    >
                      <Plus className="h-3 w-3" />
                      添加字段
                    </button>
                  </div>

                  <div className="space-y-2">
                    {newConfig.selectors.map((selector, index) => (
                      <div
                        key={selector.id}
                        className="flex items-center gap-2 p-3 rounded-lg border border-border bg-background"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={selector.fieldName}
                              onChange={(e) => handleUpdateSelector(index, 'fieldName', e.target.value)}
                              placeholder="字段名称"
                              className="w-24 px-2 py-1.5 rounded border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary/20"
                            />
                            <select
                              value={selector.fieldType}
                              onChange={(e) => handleUpdateSelector(index, 'fieldType', e.target.value as 'text' | 'textarea' | 'select')}
                              className="px-2 py-1.5 rounded border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary/20"
                            >
                              <option value="text">文本框</option>
                              <option value="textarea">多行文本</option>
                              <option value="select">下拉框</option>
                            </select>
                            <input
                              type="text"
                              value={selector.selector}
                              onChange={(e) => handleUpdateSelector(index, 'selector', e.target.value)}
                              placeholder="CSS选择器"
                              className="flex-1 px-2 py-1.5 rounded border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary/20"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteSelector(index)}
                          className="p-1 rounded text-muted-foreground hover:text-red-500 transition-all"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {newConfig.selectors.length === 0 && (
                    <div className="text-center py-4 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
                      <p>暂无字段配置</p>
                      <p className="text-xs mt-1">点击上方按钮添加需要自动填写的字段</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 rounded-lg border border-border text-foreground text-sm hover:bg-accent/50 transition-all"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAddConfig}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-all flex items-center gap-1.5"
                  >
                    <Save className="h-3.5 w-3.5" />
                    保存配置
                  </button>
                </div>
              </motion.div>
            )}

            {activeConfig && !isAdding && (
              <motion.div
                key="view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-semibold text-foreground">{activeConfig.name}</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">{activeConfig.url}</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsEditing(true)
                      setNewConfig({
                        name: activeConfig.name,
                        url: activeConfig.url,
                        selectors: [...activeConfig.selectors],
                      })
                    }}
                    className="px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-accent/50 transition-all"
                  >
                    编辑
                  </button>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <h5 className="text-xs font-medium text-muted-foreground mb-3">配置的字段</h5>
                  <div className="space-y-2">
                    {activeConfig.selectors.map((sel) => (
                      <div
                        key={sel.id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-background border border-border"
                      >
                        <div>
                          <span className="text-sm font-medium text-foreground">{sel.fieldName}</span>
                          <span className="text-xs text-muted-foreground ml-2">({sel.fieldType})</span>
                        </div>
                        <code className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">
                          {sel.selector}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-orange-50/50 border border-orange-200/50 dark:border-orange-800/30">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
                        使用说明
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 leading-relaxed">
                        1. 点击下方按钮复制自动填写脚本<br />
                        2. 打开目标网页，按F12打开开发者工具<br />
                        3. 在控制台粘贴脚本并回车执行<br />
                        4. 反馈数据将自动填充到配置的字段中
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCopyScript}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-foreground text-sm hover:bg-accent/50 transition-all"
                  >
                    {copiedScript ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        复制脚本
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleOpenTargetPage}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-all"
                  >
                    <ExternalLink className="h-4 w-4" />
                    打开网页
                  </button>
                </div>
              </motion.div>
            )}

            {!activeConfig && !isAdding && (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <Globe className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">选择一个配置查看详情</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  或点击左侧按钮添加新的目标网页配置
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}