'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Search, Loader2, RefreshCw, FileText, Info, Link as LinkIcon, LayoutTemplate, ChevronDown, ChevronUp } from 'lucide-react'
import { useRoleAccess } from '@/lib/use-role-access'
import { useAuth } from '@/lib/auth-store'
import { PageContainer } from '@/components/ui/page-container'
import { cn } from '@/lib/utils'

interface KnowledgeEntry {
  id: string
  keywords: string[]
  title: string
  content: string
  type: string
  priority: number
  enabled: boolean
  url?: string
}

export default function CampusKnowledgeBasePage() {
  const { isCampusAdmin } = useRoleAccess()
  const { getToken } = useAuth()
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const fetchData = async () => {
    setLoading(true)
    setError('')
    const token = getToken()
    try {
      const res = await fetch('/api/public-knowledge', {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      })
      const result = await res.json()
      if (!res.ok) {
        setError(result.error || '获取数据失败')
        return
      }
      setEntries(result.data || [])
    } catch {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isCampusAdmin) fetchData()
  }, [isCampusAdmin])

  const filteredEntries = entries.filter(entry => {
    if (!entry.enabled) return false
    const matchesSearch = !searchQuery ||
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = typeFilter === 'all' || entry.type === typeFilter
    return matchesSearch && matchesType
  })

  const typeLabels: Record<string, string> = {
    all: '全部类型',
    info: '操作指引',
    document: '文档说明',
    template: '模板参考',
    link: '外部链接',
  }

  const typeIcons: Record<string, React.ReactNode> = {
    info: <Info className="w-4 h-4" />,
    document: <FileText className="w-4 h-4" />,
    template: <LayoutTemplate className="w-4 h-4" />,
    link: <LinkIcon className="w-4 h-4" />,
  }

  if (!isCampusAdmin) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64 text-muted-foreground">无权访问此页面</div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">知识库管理</h1>
          <p className="text-sm text-muted-foreground mt-1">查看校区公共知识库内容</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索知识库..."
              className="w-full h-10 pl-10 pr-4 text-sm rounded-xl border border-input bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 px-4 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            {Object.entries(typeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button
            onClick={fetchData}
            className="h-10 px-4 rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="text-destructive">{error}</p>
            <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <RefreshCw className="w-4 h-4" />重试
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEntries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="rounded-2xl border border-border bg-card overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-accent/30 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                      entry.type === 'info' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                      entry.type === 'document' && 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
                      entry.type === 'template' && 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
                      entry.type === 'link' && 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
                    )}>
                      {typeIcons[entry.type] || <FileText className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{entry.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {typeLabels[entry.type] || entry.type}
                      </p>
                    </div>
                  </div>
                  {expandedId === entry.id ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </button>
                {expandedId === entry.id && (
                  <div className="px-5 pb-5 pt-0 border-t border-border">
                    <div className="mt-3 flex flex-wrap gap-2">
                      {entry.keywords.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-accent text-muted-foreground">
                          {kw}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {entry.content}
                    </div>
                    {entry.url && (
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        访问链接
                      </a>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
            {filteredEntries.length === 0 && (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                没有找到匹配的知识库内容
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
