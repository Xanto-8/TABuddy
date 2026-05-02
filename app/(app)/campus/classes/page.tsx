'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  GraduationCap, Users, Search, Loader2, RefreshCw, Filter, ChevronDown
} from 'lucide-react'
import { useRoleAccess } from '@/lib/use-role-access'
import { useAuth } from '@/lib/auth-store'
import { PageContainer } from '@/components/ui/page-container'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface ClassInfo {
  id: string
  name: string
  studentCount: number
  createdAt: string
}

interface AdminWithClasses {
  adminId: string
  adminName: string
  adminAvatar: string | null
  totalClasses: number
  totalStudents: number
  classes: ClassInfo[]
}

interface OverviewData {
  totalBoundAdmins: number
  totalClasses: number
  totalStudents: number
  adminDetails: AdminWithClasses[]
}

export default function CampusClassesPage() {
  const { isCampusAdmin } = useRoleAccess()
  const { getToken } = useAuth()
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAdmin, setSelectedAdmin] = useState<string | null>(null)

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

  const filteredAdmins = data?.adminDetails
    .filter(admin => !selectedAdmin || admin.adminId === selectedAdmin)
    .map(admin => ({
      ...admin,
      classes: admin.classes.filter(cls =>
        cls.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter(admin => admin.classes.length > 0) || []

  const allClasses = data?.adminDetails.flatMap(admin =>
    admin.classes.map(cls => ({ ...cls, adminName: admin.adminName, adminId: admin.adminId }))
  ) || []

  const filteredAllClasses = allClasses.filter(cls =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (!selectedAdmin || cls.adminId === selectedAdmin)
  )

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">校区班级管理</h1>
          <p className="text-sm text-muted-foreground mt-1">查看校区内所有班级的详细信息</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索班级名称..."
              className="w-full h-10 pl-10 pr-4 text-sm rounded-xl border border-input bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="relative">
            <select
              value={selectedAdmin || ''}
              onChange={(e) => setSelectedAdmin(e.target.value || null)}
              className="h-10 pl-4 pr-10 text-sm rounded-xl border border-input bg-background appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
            >
              <option value="">所有管理员</option>
              {data?.adminDetails.map(admin => (
                <option key={admin.adminId} value={admin.adminId}>{admin.adminName}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
          <button
            onClick={fetchData}
            className="h-10 px-4 rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="刷新"
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
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              重试
            </button>
          </div>
        ) : !data || data.totalBoundAdmins === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground">暂无班级数据，请先绑定班级管理员</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              共 {filteredAllClasses.length} 个班级
              {selectedAdmin && `（已筛选管理员）`}
              {searchQuery && `（搜索: ${searchQuery}）`}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAllClasses.map((cls, index) => (
                <Link key={cls.id} href={`/campus/classes/${cls.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-5 rounded-2xl border border-border bg-card hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{cls.name}</p>
                          <p className="text-xs text-muted-foreground">{cls.adminName}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{cls.studentCount} 名学生</span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
            {filteredAllClasses.length === 0 && (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                没有找到匹配的班级
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
