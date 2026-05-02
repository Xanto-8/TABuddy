'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, RefreshCw, Loader2, Copy, CheckCheck, Clock } from 'lucide-react'
import { useRoleAccess } from '@/lib/use-role-access'
import { useAuth } from '@/lib/auth-store'
import { PageContainer } from '@/components/ui/page-container'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface TeacherCode {
  id: string
  code: string
  isActive: boolean
  createdAt: string
  classAdmin: { id: string; displayName: string; username: string }
}

export default function CampusTeacherCodePage() {
  const { isCampusAdmin } = useRoleAccess()
  const { getToken } = useAuth()
  const [codes, setCodes] = useState<TeacherCode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const authHeaders = (): Record<string, string> => {
    const token = getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/campus/teacher-codes', { headers: authHeaders() })
      const result = await res.json()
      if (!res.ok) {
        setError(result.error || '获取数据失败')
        return
      }
      setCodes(result.data?.codes || [])
    } catch {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isCampusAdmin) fetchData()
  }, [isCampusAdmin])

  const handleCopy = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedId(id)
      toast.success('已复制')
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('复制失败')
    }
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
          <h1 className="text-2xl font-bold text-foreground">老师注册码管理</h1>
          <p className="text-sm text-muted-foreground mt-1">查看校区内所有班级管理员的老师注册码</p>
        </div>

        <div className="flex items-center justify-end">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            刷新
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
        ) : codes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground">暂无老师注册码数据</p>
          </div>
        ) : (
          <div className="space-y-3">
            {codes.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-5 rounded-2xl border border-border bg-card"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-mono text-foreground font-bold tracking-wider">{item.code}</p>
                      <p className="text-xs text-muted-foreground">
                        管理员: {item.classAdmin.displayName || item.classAdmin.username}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(item.code, item.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      title="复制注册码"
                    >
                      {copiedId === item.id ? (
                        <CheckCheck className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <span className={cn(
                      'px-2.5 py-1 text-xs rounded-full font-medium',
                      item.isActive
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-400'
                    )}>
                      {item.isActive ? '可用' : '已使用'}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>创建于 {new Date(item.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
