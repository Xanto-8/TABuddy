'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, GraduationCap, BookOpen, School, ChevronRight, Loader2, RefreshCw, KeyRound
} from 'lucide-react'
import { useRoleAccess } from '@/lib/use-role-access'
import { useAuth } from '@/lib/auth-store'
import { PageContainer } from '@/components/ui/page-container'
import { CampusBindCodeModal } from '@/components/campus/campus-bind-code-modal'
import { toast } from 'sonner'
import Link from 'next/link'

interface AdminDetail {
  adminId: string
  adminName: string
  adminAvatar: string | null
  bindedAt: string | null
  totalClasses: number
  totalStudents: number
  classes: {
    id: string
    name: string
    studentCount: number
    createdAt: string
  }[]
}

interface OverviewData {
  totalBoundAdmins: number
  totalClasses: number
  totalStudents: number
  adminDetails: AdminDetail[]
}

export default function CampusDashboardPage() {
  const { isCampusAdmin } = useRoleAccess()
  const { getToken } = useAuth()
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showBindModal, setShowBindModal] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError('')
    const token = getToken()
    try {
      const res = await fetch('/api/campus/overview', {
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
    if (isCampusAdmin) {
      fetchData()
    }
  }, [isCampusAdmin])

  if (!isCampusAdmin) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          无权访问此页面
        </div>
      </PageContainer>
    )
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-destructive">{error}</p>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </button>
        </div>
      </PageContainer>
    )
  }

  if (!data || data.totalBoundAdmins === 0) {
    return (
      <PageContainer>
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">校区仪表盘</h1>
            <p className="text-sm text-muted-foreground mt-1">欢迎使用校区管理功能</p>
          </div>

          <div className="flex flex-col items-center justify-center py-16 gap-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <School className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center max-w-md">
              <h2 className="text-lg font-semibold text-foreground">还没有绑定任何班级管理员</h2>
              <p className="text-sm text-muted-foreground mt-2">
                请让班级管理员在「助教与绑定管理」页面生成校区邀请码，然后您在这里输入邀请码进行绑定。
              </p>
            </div>
            <button
              onClick={() => setShowBindModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              <KeyRound className="w-5 h-5" />
              输入校区邀请码
            </button>
          </div>

          {showBindModal && (
            <CampusBindCodeModal
              onClose={() => setShowBindModal(false)}
              onSuccess={() => {
                setShowBindModal(false)
                toast.success('绑定成功')
                fetchData()
              }}
            />
          )}
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">校区仪表盘</h1>
            <p className="text-sm text-muted-foreground mt-1">查看校区内所有班级的概况</p>
          </div>
          <button
            onClick={() => setShowBindModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <KeyRound className="w-4 h-4" />
            绑定班级管理员
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-5 rounded-2xl border border-border bg-card"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{data.totalBoundAdmins}</p>
                <p className="text-xs text-muted-foreground">已绑定管理员</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 rounded-2xl border border-border bg-card"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{data.totalClasses}</p>
                <p className="text-xs text-muted-foreground">班级总数</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-5 rounded-2xl border border-border bg-card"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{data.totalStudents}</p>
                <p className="text-xs text-muted-foreground">学生总数</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">各管理员班级概况</h2>
          {data.adminDetails.map((admin, index) => (
            <motion.div
              key={admin.adminId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="rounded-2xl border border-border bg-card overflow-hidden"
            >
              <div className="p-5 border-b border-border bg-accent/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                      {admin.adminName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{admin.adminName}</p>
                      <p className="text-xs text-muted-foreground">
                        {admin.totalClasses} 个班级 · {admin.totalStudents} 名学生
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/campus/classes?adminId=${admin.adminId}`}
                    className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    查看班级
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <div className="divide-y divide-border">
                {admin.classes.slice(0, 5).map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary/60" />
                      <span className="text-sm text-foreground">{cls.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {cls.studentCount} 名学生
                    </span>
                  </div>
                ))}
                {admin.classes.length > 5 && (
                  <div className="px-5 py-3 text-xs text-muted-foreground text-center">
                    还有 {admin.classes.length - 5} 个班级
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {showBindModal && (
        <CampusBindCodeModal
          onClose={() => setShowBindModal(false)}
          onSuccess={() => {
            setShowBindModal(false)
            toast.success('绑定成功')
            fetchData()
          }}
        />
      )}
    </PageContainer>
  )
}
