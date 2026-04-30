'use client'

import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'
import { TrendingUp, Download, BarChart3, Target, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DashboardData, TimeFilter } from './use-dashboard-data'

interface Props {
  data: DashboardData
}

const filterOptions: { key: TimeFilter; label: string }[] = [
  { key: 'today', label: '今日' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'semester', label: '本学期' },
]

export function PerformanceChart({ data }: Props) {
  const { performanceData, timeFilter, setTimeFilter } = data

  const chartData = performanceData.labels.map((label, i) => ({
    name: label,
    efficiency: performanceData.efficiency[i] || 0,
    tasks: performanceData.tasks[i] || 0,
    feedback: performanceData.feedback[i] || 0,
  }))

  const totalEfficiency = performanceData.efficiency.reduce((a, b) => a + b, 0)
  const avgEfficiency = chartData.length > 0 ? Math.round(totalEfficiency / chartData.length) : 0
  const totalTasks = performanceData.tasks.reduce((a, b) => a + b, 0)
  const totalFeedback = performanceData.feedback.reduce((a, b) => a + b, 0)

  const stats = [
    {
      label: '平均效率',
      value: `${avgEfficiency}%`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: '任务总数',
      value: String(totalTasks),
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: '反馈总数',
      value: String(totalFeedback),
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: '数据维度',
      value: '3',
      icon: Users,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
  ]

  const handleExport = () => {
    const csvHeader = '维度,' + chartData.map(d => d.name).join(',')
    const efficiencyRow = '效率,' + chartData.map(d => d.efficiency).join(',')
    const tasksRow = '任务,' + chartData.map(d => d.tasks).join(',')
    const feedbackRow = '反馈,' + chartData.map(d => d.feedback).join(',')
    const csv = [csvHeader, efficiencyRow, tasksRow, feedbackRow].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `工作表现数据_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-foreground">工作表现分析</h3>
          <p className="text-sm text-muted-foreground">
            {timeFilter === 'today' ? '今日' : timeFilter === 'week' ? '本周' : timeFilter === 'month' ? '本月' : '本学期'}数据趋势
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
            {filterOptions.map(opt => (
              <button
                key={opt.key}
                onClick={() => setTimeFilter(opt.key)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                  timeFilter === opt.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            <Download className="h-3.5 w-3.5" />
            导出
          </button>
        </div>
      </div>

      <div className="mb-8" style={{ minHeight: 300 }}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '13px',
              }}
              cursor={{ fill: 'hsl(var(--muted))' }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
            />
            <Bar dataKey="efficiency" name="效率" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="tasks" name="任务" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="feedback" name="反馈" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="min-w-[180px] flex-[1_1_180px] p-4 rounded-lg border border-border bg-background hover:shadow-md hover:border-primary/50 transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
              <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                <stat.icon className={cn('h-5 w-5', stat.color)} />
              </div>
            </div>
            <div className="mt-3 h-1 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full', stat.bgColor)}
                style={{
                  width: `${Math.min(100,
                    stat.label === '平均效率' ? avgEfficiency :
                    stat.label === '任务总数' ? Math.min(100, totalTasks) :
                    stat.label === '反馈总数' ? Math.min(100, totalFeedback) :
                    60
                  )}%`
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            数据更新时间: {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            onClick={data.refreshData}
          >
            刷新数据
          </button>
        </div>
      </div>
    </div>
  )
}
