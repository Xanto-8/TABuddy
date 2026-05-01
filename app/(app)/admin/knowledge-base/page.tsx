'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Search, Pencil, Trash2, X, BookOpen, Link as LinkIcon, FileText, Info, RotateCcw, Eye, EyeOff, Shield, Bug, ChevronDown, ChevronRight, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageContainer } from '@/components/ui/page-container'
import {
  PublicKnowledgeEntry,
  getPublicKnowledgeBase,
  savePublicEntry,
  createPublicEntry,
  deletePublicEntry,
  togglePublicEntry,
  resetPublicKnowledgeBase,
  loadPublicKnowledgeBase,
} from '@/lib/public-knowledge-store'
import { useAuth } from '@/lib/auth-store'
import { toast } from 'sonner'
import { getLastSyncError, clearSyncError } from '@/lib/public-knowledge-store'

const TYPE_CONFIG: Record<PublicKnowledgeEntry['type'], { label: string; icon: React.ReactNode; color: string }> = {
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

const TYPE_OPTIONS: PublicKnowledgeEntry['type'][] = ['link', 'template', 'document', 'info']

const emptyForm: Omit<PublicKnowledgeEntry, 'id'> = {
  title: '',
  keywords: [],
  content: '',
  type: 'info',
  url: '',
  priority: 3,
  enabled: true,
}

export default function AdminKnowledgeBasePage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [entries, setEntries] = useState<PublicKnowledgeEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [editingEntry, setEditingEntry] = useState<PublicKnowledgeEntry | null>(null)
  const [form, setForm] = useState<Omit<PublicKnowledgeEntry, 'id'>>({ ...emptyForm })
  const [keywordsText, setKeywordsText] = useState('')
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [diagToken, setDiagToken] = useState<string | null>(null)
  const [diagTokenDecoded, setDiagTokenDecoded] = useState<string>('')
  const [diagSyncError, setDiagSyncError] = useState<string | null>(null)
  const [diagRedis, setDiagRedis] = useState<string>('未检测')
  const [diagChecking, setDiagChecking] = useState(false)

  const runDiagnostics = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('tabuddy_auth_token') : null
    setDiagToken(token)
    if (token) {
      try {
        const decoded = JSON.parse(atob(token))
        setDiagTokenDecoded(JSON.stringify(decoded, null, 2))
      } catch {
        setDiagTokenDecoded('解码失败')
      }
    } else {
      setDiagTokenDecoded('未登录/无token')
    }
    setDiagSyncError(getLastSyncError())
    setDiagChecking(true)
    try {
      const res = await fetch('/api/debug', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setDiagRedis(JSON.stringify(data, null, 2))
      } else {
        setDiagRedis(`请求失败: ${res.status}`)
      }
    } catch {
      setDiagRedis('网络请求异常')
    }
    setDiagChecking(false)
  }, [])

  useEffect(() => {
    if (isAuthenticated && user && user.role !== 'superadmin' && user.role !== 'classadmin') {
      router.replace('/knowledge-base')
    }
  }, [isAuthenticated, user, router])

  const loadEntries = useCallback(() => {
    setEntries(getPublicKnowledgeBase())
  }, [])

  useEffect(() => {
    loadPublicKnowledgeBase().then(loadEntries)
    const handleChange = () => loadEntries()
    window.addEventListener('publicKnowledgeBaseChanged', handleChange)
    return () => window.removeEventListener('publicKnowledgeBaseChanged', handleChange)
  }, [loadEntries])

  const filtered = entries.filter(e => {
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

  const openEdit = (entry: PublicKnowledgeEntry) => {
    setEditingEntry(entry)
    setForm({
      title: entry.title,
      keywords: [...entry.keywords],
      content: entry.content,
      type: entry.type,
      url: entry.url || '',
      priority: entry.priority,
      enabled: entry.enabled,
    })
    setKeywordsText(entry.keywords.join('、'))
    setShowEditor(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return
    const data = {
      ...form,
      keywords: keywordsText.split(/[,，、\s]+/).filter(Boolean),
      url: form.url || undefined,
    }
    try {
      if (editingEntry) {
        const result = await savePublicEntry({ ...data, id: editingEntry.id })
        if (result.ok) toast.success('公共条目已更新')
        else toast.error(result.error || '条目已更新，但同步到服务器失败')
      } else {
        const { synced, syncError } = await createPublicEntry(data)
        if (synced) toast.success('公共条目已添加')
        else toast.error(syncError || '条目已添加，但同步到服务器失败')
      }
    } catch {
      toast.error('保存失败，请重试')
    }
    setShowEditor(false)
    loadEntries()
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除该公共知识条目吗？')) return
    const result = await deletePublicEntry(id)
    if (result.ok) toast.success('条目已删除')
    else toast.error(result.error || '删除失败，请重试')
    loadEntries()
  }

  const handleToggle = async (id: string) => {
    const result = await togglePublicEntry(id)
    if (!result.ok) toast.error(result.error || '操作失败，请重试')
    loadEntries()
  }

  const handleReset = async () => {
    if (!window.confirm('确定要重置为默认公共知识库吗？自定义修改将全部丢失。')) return
    const result = await resetPublicKnowledgeBase()
    if (result.ok) toast.success('已重置为默认公共知识库')
    else toast.error(result.error || '重置失败，请重试')
    loadEntries()
  }

  if (user?.role !== 'superadmin' && user?.role !== 'classadmin') {
    return null
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center flex-wrap gap-3 justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">公共知识库管理</h1>
              <span className={cn(
                'px-2 py-0.5 text-[10px] font-medium rounded-full border',
                user?.role === 'superadmin'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800'
              )}>
                <Shield className="w-3 h-3 inline mr-0.5" />
                {user?.role === 'superadmin' ? '超级管理员' : '班级管理员'}
              </span>
            </div>
            <p className="text-muted-foreground mt-1">管理全局公共知识库内容，对所有用户可见，修改后实时生效</p>
          </div>
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
              添加公共条目
            </button>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索公共知识库条目..."
            className="w-full h-10 pl-10 pr-4 text-sm rounded-xl border border-input bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        <div className="border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => { setShowDiagnostics(!showDiagnostics); if (!showDiagnostics) runDiagnostics() }}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Bug className="w-3.5 h-3.5" />
              诊断信息
              {diagSyncError && <XCircle className="w-3 h-3 text-destructive" />}
            </span>
            {showDiagnostics ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          {showDiagnostics && (
            <div className="px-4 pb-3 space-y-2 text-[11px] font-mono border-t border-border pt-2">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-20 shrink-0">Auth Token:</span>
                <span className={diagToken ? 'text-green-600' : 'text-red-500'}>
                  {diagToken ? `存在 (${diagToken.length}字符)` : '不存在'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Token 解码:</span>
                <pre className="mt-0.5 p-1.5 rounded bg-muted/50 text-[10px] break-all whitespace-pre-wrap">{diagTokenDecoded}</pre>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-20 shrink-0">上次同步:</span>
                <span className={diagSyncError ? 'text-red-500' : 'text-green-600'}>
                  {diagSyncError || '成功'}
                </span>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">服务器状态 (Redis):</span>
                  <button onClick={runDiagnostics} disabled={diagChecking} className="text-primary hover:text-primary/80 transition-colors">
                    <RefreshCw className={cn('w-3 h-3', diagChecking && 'animate-spin')} />
                  </button>
                </div>
                <pre className="mt-0.5 p-1.5 rounded bg-muted/50 text-[10px] break-all whitespace-pre-wrap max-h-32 overflow-auto">{diagRedis}</pre>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">{searchQuery ? '没有匹配的知识条目' : '公共知识库为空，点击上方按钮添加条目'}</p>
            </div>
          ) : (
            filtered.map((entry, i) => {
              const typeCfg = TYPE_CONFIG[entry.type]
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn(
                    'group flex items-start gap-4 p-4 rounded-xl border transition-colors',
                    entry.enabled
                      ? 'border-border bg-card hover:bg-accent/30'
                      : 'border-dashed border-muted bg-muted/30 hover:bg-muted/50 opacity-60'
                  )}
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
                      {!entry.enabled && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                          已禁用
                        </span>
                      )}
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
                      onClick={() => handleToggle(entry.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      title={entry.enabled ? '禁用' : '启用'}
                    >
                      {entry.enabled ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
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
                {editingEntry ? '编辑公共知识条目' : '添加公共知识条目'}
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
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={form.enabled}
                  onChange={e => setForm({ ...form, enabled: e.target.checked })}
                  className="rounded border-input"
                />
                <label htmlFor="enabled" className="text-xs font-medium text-foreground">启用状态</label>
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
