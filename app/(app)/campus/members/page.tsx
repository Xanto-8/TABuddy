'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, GraduationCap, Search, Loader2, RefreshCw, School, Clock } from 'lucide-react'
import { useRoleAccess } from '@/lib/use-role-access'
import { useAuth } from '@/lib/auth-store'
import { PageContainer } from '@/components/ui/page-container'
import { cn } from '@/lib/utils'

interface AdminUser {
  id: string
  username: string
  displayName: string
  avatar: string | null
  role: string
  roleLabel: string
  createdAt: string
  lastActiveAt: string | null
  classCount: number
  studentCount: number
}

interface MembersData {
  users: AdminUser[]
  total: number
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

export default function CampusMembersPage() {
  const { isCampusAdmin } = useRoleAccess()
  const { getToken } = useAuth()
  const [data, setData] = useState<MembersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchData = async () => {
    setLoading(true)
    setError('')
    const token = getToken()
    try {
      const res = await fetch('/api/campus/members', {
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

  if (!isCampusAdmin) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64 text-muted-foreground">无权访问此页面</div>
      </PageContainer>
    )
  }

  const filteredUsers = data?.users.filter(u =>
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">校区成员管理</h1>
          <p className="text-sm text-muted-foreground mt-1">查看校区内所有班级管理员的概况</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索管理员姓名..."
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
        ) : !data || data.total === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground">暂无成员数据，请先绑定班级管理员</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">共 {filteredUsers.length} 位班级管理员</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((admin, index) => (
                <motion.div
                  key={admin.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-5 rounded-2xl border border-border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-primary-foreground font-semibold text-lg shrink-0">
                      {(admin.displayName || admin.username).charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">
                        {admin.displayName || admin.username}
                      </p>
                      {admin.displayName && admin.username !== admin.displayName && (
                        <p className="text-xs text-muted-foreground truncate">@{admin.username}</p>
                      )}
                    </div>
                    <span className="px-2.5 py-1 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shrink-0">
                      {admin.roleLabel}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <GraduationCap className="w-4 h-4" />
                      <span>{admin.classCount} 个班级</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <School className="w-4 h-4" />
                      <span>{admin.studentCount} 名学生</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>最近活跃: {timeAgo(admin.lastActiveAt)}</span>
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
