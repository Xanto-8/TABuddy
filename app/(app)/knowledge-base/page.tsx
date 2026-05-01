'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Pencil, Trash2, X, BookOpen, Link as LinkIcon, FileText, Info, RotateCcw, Globe, Lock, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageContainer } from '@/components/ui/page-container'
import {
  KnowledgeEntry,
  getKnowledgeBase,
  saveKnowledgeEntry,
  createKnowledgeEntry,
  deleteKnowledgeEntry,
  resetKnowledgeBase,
} from '@/lib/knowledge-base-store'
import {
  PublicKnowledgeEntry,
  getPublicKnowledgeBase,
  loadPublicKnowledgeBase,
} from '@/lib/public-knowledge-store'

type TabType = 'private' | 'public'

const TYPE_CONFIG: Record<KnowledgeEntry['type'], { label: string; icon: React.ReactNode; color: string }> = {
  link: {
    label: '链接',
    icon: <LinkIcon className="w-3.5 h-3.5" />,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  template: {
    label: '模板',
    icon: <FileText className="w-3.5 h-3.5" />,
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  document: {
    label: '文档',
    icon: <BookOpen className="w-3.5 h-3.5" />,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
  info: {
    label: '信息',
    icon: <Info className="w-3.5 h-3.5" />,
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
}

const TYPE_OPTIONS: KnowledgeEntry['type'][] = ['link', 'template', 'document', 'info']

const emptyForm: Omit<KnowledgeEntry, 'id'> = {
  title: '',
  keywords: [],
  content: '',
  type: 'info',
  url: '',
  priority: 3,
}

export default function KnowledgeBasePage() {
  const [activeTab, setActiveTab] = useState<TabType>('private')
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [publicEntries, setPublicEntries] = useState<PublicKnowledgeEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null)
  const [form, setForm] = useState<Omit<KnowledgeEntry, 'id'>>({ ...emptyForm })
  const [keywordsText, setKeywordsText] = useState('')

  const loadEntries = useCallback(() => {
    setEntries(getKnowledgeBase())
    setPublicEntries(getPublicKnowledgeBase())
  }, [])

  useEffect(() => {
    loadPublicKnowledgeBase().then(loadEntries)
    const handleChange = () => loadEntries()
    window.addEventListener('knowledgeBaseChanged', handleChange)
    window.addEventListener('publicKnowledgeBaseChanged', handleChange)
    return () => {
      window.removeEventListener('knowledgeBaseChanged', handleChange)
      window.removeEventListener('publicKnowledgeBaseChanged', handleChange)
    }
  }, [loadEntries])

  const filteredPrivate = entries.filter(e => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      e.title.toLowerCase().includes(q) ||
      e.content.toLowerCase().includes(q) ||
      e.keywords.some(k => k.toLowerCase().includes(q))
    )
  })

  const filteredPublic = publicEntries
    .filter(e => e.enabled !== false)
    .filter(e => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        e.title.toLowerCase().includes(q) ||
        e.content.toLowerCase().includes(q) ||
        e.keywords.some(k => k.toLowerCase().includes(q))
      )
    })

  const openCreate = () => {
    setEditingEntry(null)
    setForm({ ...emptyForm })
    setKeywordsText('')
    setShowEditor(true)
  }

  const openEdit = (entry: KnowledgeEntry) => {
    setEditingEntry(entry)
    setForm({
      title: entry.title,
      keywords: [...entry.keywords],
      content: entry.content,
      type: entry.type,
      url: entry.url || '',
      priority: entry.priority,
    })
    setKeywordsText(entry.keywords.join('、'))
    setShowEditor(true)
  }

  const handleSave = () => {
    if (!form.title.trim()) return
    const data = {
      ...form,
      keywords: keywordsText.split(/[,，、\s]+/).filter(Boolean),
      url: form.url || undefined,
    }
    if (editingEntry) {
      saveKnowledgeEntry({ ...data, id: editingEntry.id })
    } else {
      createKnowledgeEntry({ ...data, id: `kb-${Date.now()}` })
    }
    setShowEditor(false)
    loadEntries()
  }

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除该知识条目吗？')) {
      deleteKnowledgeEntry(id)
      loadEntries()
    }
  }

  const handleReset = () => {
    if (window.confirm('确定要重置为默认知识库吗？自定义修改将全部丢失。')) {
      resetKnowledgeBase()
      loadEntries()
    }
  }

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'private', label: '私有知识库', icon: <Lock className="w-4 h-4" /> },
    { key: 'public', label: '公共知识库', icon: <Globe className="w-4 h-4" /> },
  ]

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center flex-wrap gap-3 justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">知识库管理</h1>
            <p className="text-muted-foreground mt-1">
              {activeTab === 'private'
                ? '管理你的私有知识库内容，修改后实时生效'
                : '查看系统公共知识库内容，由管理员统一维护'}
            </p>
          </div>
          {activeTab === 'private' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="inline-flex items-center px-3 py-2 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition-all text-sm"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                恢复默认
              </button>
              <button
                onClick={openCreate}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                添加条目
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 border-b border-border">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 transition-all -mb-px',
                activeTab === tab.key
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.key === 'public' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent text-muted-foreground ml-1">
                  {publicEntries.filter(e => e.enabled !== false).length}
                </span>
              )}
              {tab.key === 'private' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent text-muted-foreground ml-1">
                  {entries.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'private' ? '搜索私有知识库条目...' : '搜索公共知识库条目...'}
            className="w-full h-10 pl-10 pr-4 text-sm rounded-xl border border-input bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        <div className="grid gap-3">
          {activeTab === 'private' && (
            filteredPrivate.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">{searchQuery ? '没有匹配的知识条目' : '私有知识库为空，点击上方按钮添加条目'}</p>
              </div>
            ) : (
              filteredPrivate.map((entry, i) => {
                const typeCfg = TYPE_CONFIG[entry.type]
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors"
                  >
                    <div className={cn('shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium', typeCfg.color)}>
                      {typeCfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-foreground truncate">{entry.title}</h3>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full shrink-0', typeCfg.color)}>
                          {typeCfg.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">优先级 {entry.priority}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">{entry.content}</p>
                      <div className="flex flex-wrap gap-1">
                        {entry.keywords.map(kw => (
                          <span key={kw} className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent text-muted-foreground">
                            {kw}
                          </span>
                        ))}
                      </div>
                      {entry.url && (
                        <a href={entry.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-primary hover:text-primary/80 transition-colors">
                          <LinkIcon className="w-3 h-3" />
                          {entry.url}
                        </a>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(entry)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )
              })
            )
          )}

          {activeTab === 'public' && (
            filteredPublic.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Globe className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">{searchQuery ? '没有匹配的知识条目' : '公共知识库暂无内容'}</p>
              </div>
            ) : (
              filteredPublic.map((entry, i) => {
                const typeCfg = TYPE_CONFIG[entry.type]
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card transition-colors"
                  >
                    <div className={cn('shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium', typeCfg.color)}>
                      {typeCfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-foreground truncate">{entry.title}</h3>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full shrink-0', typeCfg.color)}>
                          {typeCfg.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">优先级 {entry.priority}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">{entry.content}</p>
                      <div className="flex flex-wrap gap-1">
                        {entry.keywords.map(kw => (
                          <span key={kw} className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent text-muted-foreground">
                            {kw}
                          </span>
                        ))}
                      </div>
                      {entry.url && (
                        <a href={entry.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-primary hover:text-primary/80 transition-colors">
                          <LinkIcon className="w-3 h-3" />
                          {entry.url}
                        </a>
                      )}
                    </div>
                    <div className="shrink-0 w-16 text-center">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 justify-center">
                        <Globe className="w-3 h-3" />
                        公共
                      </span>
                    </div>
                  </motion.div>
                )
              })
            )
          )}
        </div>
      </div>

      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-background/60 backdrop-blur-sm" onClick={() => setShowEditor(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-lg mx-4 rounded-2xl border border-border bg-card shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">
                {editingEntry ? '编辑知识条目' : '添加知识条目'}
              </h2>
              <button onClick={() => setShowEditor(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">标题</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="知识条目标题"
                  className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">类型</label>
                <div className="flex gap-2">
                  {TYPE_OPTIONS.map(t => (
                    <button
                      key={t}
                      onClick={() => setForm({ ...form, type: t })}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all',
                        form.type === t
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent'
                      )}
                    >
                      {TYPE_CONFIG[t].icon}
                      {TYPE_CONFIG[t].label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">关键词（用空格/逗号/顿号分隔）</label>
                <input
                  type="text"
                  value={keywordsText}
                  onChange={e => setKeywordsText(e.target.value)}
                  placeholder="关键词1、关键词2、关键词3"
                  className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">内容</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  placeholder="知识条目详细内容"
                  rows={4}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">链接地址（选填）</label>
                <input
                  type="text"
                  value={form.url || ''}
                  onChange={e => setForm({ ...form, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">优先级（1-10，越高越优先匹配）</label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={form.priority}
                  onChange={e => setForm({ ...form, priority: Number(e.target.value) })}
                  className="w-full"
                />
                <span className="text-xs text-muted-foreground">{form.priority}</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
              <button
                onClick={() => setShowEditor(false)}
                className="px-4 py-2 text-sm rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!form.title.trim()}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-40"
              >
                {editingEntry ? '保存修改' : '添加'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </PageContainer>
  )
}
