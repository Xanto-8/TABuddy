'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { UserPlus, RefreshCw, Loader2, Search, Users, Clock, UserCheck } from 'lucide-react'
import { useRoleAccess } from '@/lib/use-role-access'
import { useAuth } from '@/lib/auth-store'
import { PageContainer } from '@/components/ui/page-container'
import { cn } from '@/lib/utils'

interface BindRecord {
  id: string
  createdAt: string
  bindedAt: string | null
  teacher: { id: string; displayName: string; username: string }
  assistant: { id: string; displayName: string; username: string; avatar: string | null; lastActiveAt: string | null }
}

interface BindData {
  binds: BindRecord[]
  totalBinds: number
  totalAssistants: number
  totalTeachers: number
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '从未'
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}小时前`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays}天前`
  return date.toLocaleDateString('zh-CN')
}

export default function CampusAssistantManagementPage() {
  const { isCampusAdmin } = useRoleAccess()
  const { getToken } = useAuth()
  const [data, setData] = useState<BindData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchData = async () => {
    setLoading(true)
    setError('')
    const token = getToken()
    try {
      const res = await fetch('/api/campus/assistant-binds', {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      })
      const result = await res.json()
      if (!res.ok) {
        setError(result.error || '获取数据失败')
        return
      }
      setData(result.data)
    } catch {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isCampusAdmin) fetchData()
  }, [isCampusAdmin])

  const filteredBinds = data?.binds.filter(b =>
    b.assistant.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.assistant.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.teacher.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  if (!isCampusAdmin) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64 text-muted-foreground">无权访问此页面</div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">助教与绑定管理</h1>
          <p className="text-sm text-muted-foreground mt-1">查看校区内所有助教绑定情况</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{data?.totalTeachers || 0}</p>
                <p className="text-xs text-muted-foreground">绑定管理员</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{data?.totalAssistants || 0}</p>
                <p className="text-xs text-muted-foreground">助教总数</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{data?.totalBinds || 0}</p>
                <p className="text-xs text-muted-foreground">绑定记录</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索助教或管理员..."
              className="w-full h-10 pl-10 pr-4 text-sm rounded-xl border border-input bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
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
        ) : !data || data.totalBinds === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground">暂无助教绑定数据</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">共 {filteredBinds.length} 条绑定记录</p>
            <div className="space-y-3">
              {filteredBinds.map((bind, index) => (
                <motion.div
                  key={bind.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-4 rounded-2xl border border-border bg-card"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                        {(bind.assistant.displayName || bind.assistant.username).charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {bind.assistant.displayName || bind.assistant.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          绑定管理员: {bind.teacher.displayName || bind.teacher.username}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{timeAgo(bind.assistant.lastActiveAt)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
