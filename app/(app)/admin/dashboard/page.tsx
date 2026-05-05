'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-store'
import { Users, Activity, BookOpen, Shield, TrendingUp } from 'lucide-react'

interface ClassStat {
  id: string
  name: string
  totalStudents: number
  onlineStudents: number
}

interface OverviewData {
  totalUsers: number
  onlineUsers: number
  classGroups: ClassStat[]
}

export default function AdminDashboardPage() {
  const { user, getToken } = useAuth()
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  const token = getToken()

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stats/overview', {
        headers: { authorization: `Bearer ${token}` },
      })
      const result = await res.json()
      if (result.data) setData(result.data)
    } catch (err) {
      console.error('Failed to load stats', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [fetchStats])

  if (user?.role !== 'superadmin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">无权访问，仅超级管理员可查看</p>
      </div>
    )
  }

  const statsCards = [
    {
      label: '总注册用户',
      value: data?.totalUsers ?? 0,
      icon: Users,
      color: 'from-blue-500 to-indigo-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: '实时在线',
      value: data?.onlineUsers ?? 0,
      icon: Activity,
      color: 'from-green-500 to-emerald-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400',
    },
    {
      label: '班级总数',
      value: data?.classGroups?.length ?? 0,
      icon: BookOpen,
      color: 'from-purple-500 to-pink-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      label: '在线率',
      value: data?.totalUsers ? Math.round((data.onlineUsers / data.totalUsers) * 100) + '%' : '0%',
      icon: TrendingUp,
      color: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      textColor: 'text-amber-600 dark:text-amber-400',
    },
  ]

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 md:w-6 md:h-6 text-amber-500 shrink-0" />
            超级管理员面板
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">全站数据概览与统计</p>
        </div>
        <button
          onClick={fetchStats}
          className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-accent transition-colors"
        >
          刷新数据
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map(card => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">{card.label}</span>
              <div className={`p-1.5 rounded-lg ${card.bg}`}>
                <card.icon className={`w-4 h-4 ${card.textColor}`} />
              </div>
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 md:p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          班级列表与在线统计
        </h2>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">加载中...</div>
        ) : data?.classGroups && data.classGroups.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">班级名称</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">总人数</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">在线人数</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">在线率</th>
                </tr>
              </thead>
              <tbody>
                {data.classGroups.map(cg => (
                  <tr key={cg.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-2 font-medium">{cg.name}</td>
                    <td className="py-3 px-2 text-right">{cg.totalStudents}</td>
                    <td className="py-3 px-2 text-right">
                      <span className="text-green-600 dark:text-green-400">{cg.onlineStudents}</span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      {cg.totalStudents > 0
                        ? Math.round((cg.onlineStudents / cg.totalStudents) * 100) + '%'
                        : '0%'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            暂无班级数据
          </div>
        )}
      </div>
    </div>
  )
}
