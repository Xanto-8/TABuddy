'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Pencil, Trash2, X, BookOpen, Link as LinkIcon, FileText, Info, RotateCcw, Eye, EyeOff, Shield, Bug, ChevronDown, ChevronRight, CheckCircle2, XCircle, RefreshCw, FolderOpen, ChevronLeft, Globe, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageContainer } from '@/components/ui/page-container'
import Folder from '@/app/动效/文件夹'
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
import {
  KnowledgeFolder,
  getKnowledgeFolders,
  createKnowledgeFolder,
  updateKnowledgeFolder,
  deleteKnowledgeFolder,
} from '@/lib/knowledge-folder-store'

type ViewType = 'folders' | 'folder-detail'

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

function FolderColorDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-3 h-3 rounded-full shrink-0 ring-1 ring-black/5"
      style={{ backgroundColor: color }}
    />
  )
}

export default function AdminKnowledgeBasePage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [entries, setEntries] = useState<PublicKnowledgeEntry[]>([])
  const [folders, setFolders] = useState<KnowledgeFolder[]>([])
  const [view, setView] = useState<ViewType>('folders')
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
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
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [editingFolder, setEditingFolder] = useState<KnowledgeFolder | null>(null)
  const [folderNameInput, setFolderNameInput] = useState('')
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)
  const [showUncategorizedPicker, setShowUncategorizedPicker] = useState(false)

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
    setEntries([...getPublicKnowledgeBase()])
    setFolders(getKnowledgeFolders())
  }, [])

  useEffect(() => {
    loadPublicKnowledgeBase().then(loadEntries)
    const handleChange = () => loadEntries()
    window.addEventListener('publicKnowledgeBaseChanged', handleChange)
    window.addEventListener('knowledgeFoldersChanged', handleChange)
    return () => {
      window.removeEventListener('publicKnowledgeBaseChanged', handleChange)
      window.removeEventListener('knowledgeFoldersChanged', handleChange)
    }
  }, [loadEntries])

  const activeFolder = useMemo(() => {
    if (!activeFolderId) return null
    return folders.find(f => f.id === activeFolderId) || null
  }, [activeFolderId, folders])

  const folderlessEntries = useMemo(() => {
    return entries.filter(e => !e.folderId)
  }, [entries])

  const folderEntriesMap = useMemo(() => {
    const map = new Map<string, PublicKnowledgeEntry[]>()
    for (const f of folders) {
      map.set(f.id, entries.filter(e => e.folderId === f.id))
    }
    return map
  }, [entries, folders])

  const filteredEntries = useMemo(() => {
    const source = activeFolderId
      ? folderEntriesMap.get(activeFolderId) || []
      : folderlessEntries
    if (!searchQuery) return source
    const q = searchQuery.toLowerCase()
    return source.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.content.toLowerCase().includes(q) ||
      e.keywords.some(k => k.toLowerCase().includes(q))
    )
  }, [activeFolderId, folderEntriesMap, folderlessEntries, searchQuery])

  const filteredAll = useMemo(() => {
    return entries.filter(e => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        e.title.toLowerCase().includes(q) ||
        e.content.toLowerCase().includes(q) ||
        e.keywords.some(k => k.toLowerCase().includes(q))
      )
    })
  }, [entries, searchQuery])

  const openCreate = () => {
    setEditingEntry(null)
    setForm({ ...emptyForm, folderId: activeFolderId || undefined })
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
      folderId: entry.folderId,
    })
    setKeywordsText(entry.keywords.join('、'))
    setShowEditor(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return
    const selectedFolder = form.folderId ? folders.find(f => f.id === form.folderId) : null
    const data = {
      ...form,
      keywords: keywordsText.split(/[,，、\s]+/).filter(Boolean),
      url: form.url || undefined,
      folderName: selectedFolder?.name,
      folderColor: selectedFolder?.color,
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

  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())

  const handleToggle = (id: string) => {
    setTogglingIds(prev => new Set(prev).add(id))
    const result = togglePublicEntry(id)
    if (!result.ok) {
      toast.error(result.error || '操作失败，请重试')
    } else {
      toast.success('已更新显示状态')
    }
    loadEntries()
    setTimeout(() => {
      setTogglingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 300)
  }

  const handleReset = async () => {
    if (!window.confirm('确定要重置为默认公共知识库吗？自定义修改将全部丢失。')) return
    const result = await resetPublicKnowledgeBase()
    if (result.ok) toast.success('已重置为默认公共知识库')
    else toast.error(result.error || '重置失败，请重试')
    loadEntries()
  }

  const openCreateFolder = () => {
    setEditingFolder(null)
    setFolderNameInput('')
    setShowFolderModal(true)
  }

  const openRenameFolder = (folder: KnowledgeFolder) => {
    setEditingFolder(folder)
    setFolderNameInput(folder.name)
    setShowFolderModal(true)
  }

  const handleSaveFolder = () => {
    const name = folderNameInput.trim()
    if (!name) return
    if (editingFolder) {
      updateKnowledgeFolder(editingFolder.id, { name })
      for (const entry of entries) {
        if (entry.folderId === editingFolder.id) {
          savePublicEntry({ ...entry, folderName: name })
        }
      }
    } else {
      createKnowledgeFolder(name)
    }
    setShowFolderModal(false)
    loadEntries()
  }

  const handleDeleteFolder = (folderId: string) => {
    const count = folderEntriesMap.get(folderId)?.length || 0
    const msg = count > 0
      ? `文件夹内有 ${count} 个知识条目。删除文件夹后，这些条目将变为「未分类」。确定删除吗？`
      : '确定要删除该文件夹吗？'
    if (window.confirm(msg)) {
      for (const entry of entries) {
        if (entry.folderId === folderId) {
          savePublicEntry({ ...entry, folderId: undefined })
        }
      }
      deleteKnowledgeFolder(folderId)
      if (activeFolderId === folderId) {
        setView('folders')
        setActiveFolderId(null)
      }
      loadEntries()
    }
  }

  const enterFolder = (folderId: string) => {
    setActiveFolderId(folderId)
    setView('folder-detail')
    setSearchQuery('')
  }

  const leaveFolder = () => {
    setActiveFolderId(null)
    setView('folders')
    setSearchQuery('')
  }

  const handleDragStart = (e: React.DragEvent, entryId: string) => {
    e.dataTransfer.setData('text/kb-entry-id', entryId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverFolderId(folderId)
  }

  const handleDragLeave = () => {
    setDragOverFolderId(null)
  }

  const handleDrop = (e: React.DragEvent, folderId: string) => {
    e.preventDefault()
    const entryId = e.dataTransfer.getData('text/kb-entry-id')
    if (entryId) {
      const entry = entries.find(ent => ent.id === entryId)
      if (entry && entry.folderId !== folderId) {
        savePublicEntry({ ...entry, folderId })
        loadEntries()
      }
    }
    setDragOverFolderId(null)
  }

  if (user?.role !== 'superadmin' && user?.role !== 'classadmin') {
    return null
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center flex-wrap gap-3 justify-between">
          <div>
            {view === 'folder-detail' && activeFolder ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={leaveFolder}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <FolderColorDot color={activeFolder.color} />
                    <h1 className="text-2xl font-bold text-foreground">{activeFolder.name}</h1>
                    <button
                      onClick={() => openRenameFolder(activeFolder)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
                      {filteredEntries.length} 个条目
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1">管理文件夹内的公共知识条目</p>
                </div>
              </div>
            ) : (
              <>
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
                <p className="text-muted-foreground mt-1">使用文件夹分类管理公共知识条目，对所有用户可见</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {view === 'folders' && (
              <button
                onClick={openCreateFolder}
                className="inline-flex items-center px-3 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-all text-sm"
              >
                <FolderOpen className="w-4 h-4 mr-1.5" />
                创建文件夹
              </button>
            )}
            {view === 'folder-detail' && (
              <button
                onClick={openCreate}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                添加公共条目
              </button>
            )}
            {view === 'folders' && (
              <button
                onClick={openCreate}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                添加公共条目
              </button>
            )}
            <button
              onClick={handleReset}
              className="inline-flex items-center px-3 py-2 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition-all text-sm"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              恢复默认
            </button>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={view === 'folders' ? '搜索文件夹...' : '搜索条目...'}
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

        {view === 'folders' && (
          <AnimatePresence mode="wait">
            <motion.div
              key="folder-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {folders.length === 0 && folderlessEntries.length === 0 && filteredAll.length > 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">没有匹配的条目</p>
                </div>
              ) : folders.length === 0 && folderlessEntries.length === 0 && filteredAll.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">公共知识库为空，点击上方按钮创建文件夹或添加条目</p>
                </div>
              ) : (
                <>
                  {folders.length > 0 && (
                    <div>
                      <h2 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                        <FolderOpen className="w-4 h-4" />
                        文件夹
                      </h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {folders.map((folder) => {
                          const folderEntries = folderEntriesMap.get(folder.id) || []
                          const isDragOver = dragOverFolderId === folder.id
                          return (
                            <motion.div
                              key={folder.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={cn(
                                'flex flex-col items-center gap-2 group cursor-pointer transition-all',
                                isDragOver && 'scale-110'
                              )}
                              onClick={() => enterFolder(folder.id)}
                              onDragOver={e => handleDragOver(e, folder.id)}
                              onDragLeave={handleDragLeave}
                              onDrop={e => handleDrop(e, folder.id)}
                            >
                              <div className={cn('relative', isDragOver && 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-2xl')}>
                                <Folder
                                  color={folder.color}
                                  size={1.1}
                                  items={folderEntries.slice(0, 3).map(e => (
                                    <div
                                      key={e.id}
                                      className="w-full h-full flex items-center justify-center"
                                    >
                                      <span className="text-[6px] text-gray-400 font-medium truncate px-0.5 leading-tight text-center">
                                        {e.title}
                                      </span>
                                    </div>
                                  ))}
                                />
                                <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openRenameFolder(folder) }}
                                    className="w-6 h-6 rounded-full bg-background border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id) }}
                                    className="w-6 h-6 rounded-full bg-background border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-medium text-foreground truncate max-w-[120px]">
                                  {folder.name}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {folderEntries.length} 个条目
                                </p>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {folderlessEntries.length > 0 && (
                    <div>
                      <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        未分类
                      </h2>
                      <div className="grid gap-2">
                        {folderlessEntries.map((entry, i) => {
                          const typeCfg = TYPE_CONFIG[entry.type]
                          return (
                            <motion.div
                              key={entry.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.02 }}
                              draggable
                              onDragStart={(e: any) => handleDragStart(e, entry.id)}
                              className={cn(
                                'group flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-grab active:cursor-grabbing',
                                entry.enabled
                                  ? 'border-border bg-card hover:bg-accent/30'
                                  : 'border-dashed border-muted bg-muted/30 hover:bg-muted/50 opacity-60'
                              )}
                            >
                              <div className={cn('shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium', typeCfg.color)}>
                                {typeCfg.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <h3 className="text-sm font-medium text-foreground truncate">{entry.title}</h3>
                                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full shrink-0', typeCfg.color)}>
                                    {typeCfg.label}
                                  </span>
                                  {!entry.enabled && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0 flex items-center gap-0.5">
                                      <EyeOff className="w-2.5 h-2.5" />
                                      已隐藏
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-1">{entry.content}</p>
                              </div>
                              <div className="shrink-0 flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleToggle(entry.id)}
                                  className={cn(
                                    'w-7 h-7 rounded-lg flex items-center justify-center transition-all',
                                    togglingIds.has(entry.id) ? 'scale-110 text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                  )}
                                  title={entry.enabled ? '隐藏' : '取消隐藏'}
                                >
                                  {entry.enabled
                                    ? <EyeOff className={cn('w-3.5 h-3.5', togglingIds.has(entry.id) && 'animate-in zoom-in duration-200')} />
                                    : <Eye className={cn('w-3.5 h-3.5', togglingIds.has(entry.id) && 'animate-in zoom-in duration-200')} />
                                  }
                                </button>
                                <button onClick={() => openEdit(entry)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDelete(entry.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {folders.length === 0 && folderlessEntries.length === 0 && searchQuery && filteredAll.length > 0 && (
                    <div>
                      <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        所有条目
                      </h2>
                      <div className="grid gap-2">
                        {filteredAll.map((entry, i) => {
                          const typeCfg = TYPE_CONFIG[entry.type]
                          return (
                            <motion.div
                              key={entry.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.02 }}
                              className={cn(
                                'group flex items-start gap-3 p-3 rounded-xl border transition-colors',
                                entry.enabled
                                  ? 'border-border bg-card hover:bg-accent/30'
                                  : 'border-dashed border-muted bg-muted/30 hover:bg-muted/50 opacity-60'
                              )}
                            >
                              <div className={cn('shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium', typeCfg.color)}>
                                {typeCfg.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <h3 className="text-sm font-medium text-foreground truncate">{entry.title}</h3>
                                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full shrink-0', typeCfg.color)}>
                                    {typeCfg.label}
                                  </span>
                                  {!entry.enabled && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0 flex items-center gap-0.5">
                                      <EyeOff className="w-2.5 h-2.5" />
                                      已隐藏
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-1">{entry.content}</p>
                              </div>
                              <div className="shrink-0 flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleToggle(entry.id)}
                                  className={cn(
                                    'w-7 h-7 rounded-lg flex items-center justify-center transition-all',
                                    togglingIds.has(entry.id) ? 'scale-110 text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                  )}
                                  title={entry.enabled ? '隐藏' : '取消隐藏'}
                                >
                                  {entry.enabled
                                    ? <EyeOff className={cn('w-3.5 h-3.5', togglingIds.has(entry.id) && 'animate-in zoom-in duration-200')} />
                                    : <Eye className={cn('w-3.5 h-3.5', togglingIds.has(entry.id) && 'animate-in zoom-in duration-200')} />
                                  }
                                </button>
                                <button onClick={() => openEdit(entry)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDelete(entry.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {view === 'folder-detail' && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`folder-${activeFolderId}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {filteredEntries.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">
                    {searchQuery ? '没有匹配的知识条目' : '此文件夹为空，点击上方按钮添加条目'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredEntries.map((entry, i) => {
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
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0 flex items-center gap-0.5">
                                <EyeOff className="w-2.5 h-2.5" />
                                已隐藏
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
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                              togglingIds.has(entry.id) ? 'scale-110 text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                            )}
                            title={entry.enabled ? '隐藏' : '取消隐藏'}
                          >
                            {entry.enabled
                              ? <EyeOff className={cn('w-3.5 h-3.5', togglingIds.has(entry.id) && 'animate-in zoom-in duration-200')} />
                              : <Eye className={cn('w-3.5 h-3.5', togglingIds.has(entry.id) && 'animate-in zoom-in duration-200')} />
                            }
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
                  })}
                </div>
              )}

              {activeFolderId && folderlessEntries.length > 0 && (
                <div className="border border-dashed border-border rounded-xl mt-6">
                  <button
                    onClick={() => setShowUncategorizedPicker(!showUncategorizedPicker)}
                    className="w-full flex items-center justify-between px-4 py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors rounded-xl"
                  >
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      从「未分类」添加条目到此文件夹（{folderlessEntries.length} 个可用）
                    </span>
                    {showUncategorizedPicker ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {showUncategorizedPicker && (
                    <div className="px-4 pb-3 space-y-2 border-t border-border pt-3">
                      {folderlessEntries.map(entry => {
                        const typeCfg = TYPE_CONFIG[entry.type]
                        return (
                          <div key={entry.id} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className={cn('shrink-0 w-6 h-6 rounded flex items-center justify-center text-[10px]', typeCfg.color)}>
                                {typeCfg.icon}
                              </div>
                              <span className="text-xs text-foreground truncate">{entry.title}</span>
                            </div>
                            <button
                              onClick={() => {
                                savePublicEntry({ ...entry, folderId: activeFolderId! })
                                loadEntries()
                                setShowUncategorizedPicker(false)
                              }}
                              className="shrink-0 px-2.5 py-1 text-[11px] rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
                            >
                              添加到此处
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {showFolderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={() => setShowFolderModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm mx-4 rounded-2xl border border-border bg-card shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-base font-semibold text-foreground">
                  {editingFolder ? '重命名文件夹' : '创建文件夹'}
                </h2>
                <button onClick={() => setShowFolderModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-6 py-4">
                <label className="block text-xs font-medium text-foreground mb-1.5">文件夹名称</label>
                <input
                  type="text"
                  value={folderNameInput}
                  onChange={e => setFolderNameInput(e.target.value)}
                  placeholder="输入文件夹名称"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveFolder() }}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
                <button
                  onClick={() => setShowFolderModal(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveFolder}
                  disabled={!folderNameInput.trim()}
                  className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-40"
                >
                  {editingFolder ? '保存' : '创建'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                <label className="block text-xs font-medium text-foreground mb-1.5">所属文件夹（选填）</label>
                <select
                  value={form.folderId || ''}
                  onChange={e => setForm({ ...form, folderId: e.target.value || undefined })}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                >
                  <option value="">未分类</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
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
