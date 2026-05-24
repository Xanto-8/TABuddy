'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts'
import { BarChart3, Users, BookOpen, FileText, Target } from 'lucide-react'
import { getClasses, getStudentsByClass, getAllOverallAccuracyRecords, getQuizRecordsByClass, getStudents, getQuizRecordsByStudent } from '@/lib/store'
import type { Class, Student, QuizRecord } from '@/types'
import { PageContainer } from '@/components/ui/page-container'

const TABS = [
  { key: 'overview', label: '班级概览' },
  { key: 'quiz', label: '小测分析' },
  { key: 'progress', label: '学生进步' },
] as const

type TabKey = (typeof TABS)[number]['key']

const COLORS = ['hsl(var(--primary))', '#82ca9d', '#ffc658', '#ff8042']

const PIE_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e']

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function StatsPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [filterClassId, setFilterClassId] = useState('all')
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [studentSearch, setStudentSearch] = useState('')

  const refresh = useCallback(() => {
    const allClasses = getClasses()
    setClasses(allClasses)
    const allStudents = getStudents()
    setStudents(allStudents)
  }, [])

  useEffect(() => {
    refresh()
    const handler = () => refresh()
    window.addEventListener('classDataChanged', handler)
    return () => window.removeEventListener('classDataChanged', handler)
  }, [refresh])

  const allAccuracyRecords = useMemo(() => getAllOverallAccuracyRecords(), [])

  const filteredAccuracyRecords = useMemo(() => {
    if (filterClassId === 'all') return allAccuracyRecords
    return allAccuracyRecords.filter((r) => r.classId === filterClassId)
  }, [filterClassId, allAccuracyRecords])

  const filteredQuizRecords = useMemo(() => {
    if (filterClassId === 'all') {
      return allAccuracyRecords.length > 0
        ? getQuizRecordsByClass('')
        : []
    }
    return getQuizRecordsByClass(filterClassId)
  }, [filterClassId, allAccuracyRecords])

  const allQuizRecords = useMemo(() => {
    const allClasses = getClasses()
    return allClasses.flatMap((c) => getQuizRecordsByClass(c.id))
  }, [])

  const totalStudents = useMemo(() => {
    if (filterClassId === 'all') {
      const ids = new Set(students.map((s) => s.id))
      return ids.size
    }
    return getStudentsByClass(filterClassId).length
  }, [filterClassId, students])

  const thisMonthRecords = useMemo(() => {
    const now = new Date()
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    return allAccuracyRecords.filter((r) => r.date >= monthStart).length
  }, [allAccuracyRecords])

  const averageAccuracy = useMemo(() => {
    const records = filteredAccuracyRecords
    if (records.length === 0) return 0
    const sum = records.reduce((acc, r) => acc + r.overallAccuracy, 0)
    return Math.round((sum / records.length) * 10) / 10
  }, [filteredAccuracyRecords])

  const classBarData = useMemo(() => {
    const map = new Map<string, { sum: number; count: number; name: string }>()
    for (const r of allAccuracyRecords) {
      const cls = classes.find((c) => c.id === r.classId)
      const name = cls?.name || r.classId
      const entry = map.get(r.classId) || { sum: 0, count: 0, name }
      entry.sum += r.overallAccuracy
      entry.count += 1
      map.set(r.classId, entry)
    }
    if (filterClassId !== 'all') {
      const entry = map.get(filterClassId)
      return entry ? [{ name: entry.name, accuracy: Math.round((entry.sum / entry.count) * 10) / 10 }] : []
    }
    return Array.from(map.values()).map((e) => ({
      name: e.name,
      accuracy: Math.round((e.sum / e.count) * 10) / 10,
    }))
  }, [allAccuracyRecords, classes, filterClassId])

  const trendData = useMemo(() => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const dateMap = new Map<string, { sum: number; count: number }>()
    const records = filteredAccuracyRecords
    for (const r of records) {
      if (r.date < formatDate(thirtyDaysAgo)) continue
      const entry = dateMap.get(r.date) || { sum: 0, count: 0 }
      entry.sum += r.overallAccuracy
      entry.count += 1
      dateMap.set(r.date, entry)
    }
    const sortedDates = Array.from(dateMap.keys()).sort()
    return sortedDates.map((date) => ({
      date,
      accuracy: Math.round((dateMap.get(date)!.sum / dateMap.get(date)!.count) * 10) / 10,
    }))
  }, [filteredAccuracyRecords])

  const quizForAnalysis = useMemo(() => {
    if (filterClassId === 'all') return allQuizRecords
    return getQuizRecordsByClass(filterClassId)
  }, [filterClassId, allQuizRecords])

  const wordAccuracyData = useMemo(() => {
    const buckets = { low: 0, mid: 0, high: 0, excellent: 0 }
    const records = quizForAnalysis
    for (const r of records) {
      let acc = r.overallAccuracy
      if (acc == null && r.wordScore != null && r.wordTotal != null && r.wordTotal > 0) {
        acc = Math.round((r.wordScore / r.wordTotal) * 1000) / 10
      }
      if (acc == null) continue
      if (acc < 60) buckets.low++
      else if (acc < 80) buckets.mid++
      else if (acc < 90) buckets.high++
      else buckets.excellent++
    }
    return [
      { name: '<60%', value: buckets.low },
      { name: '60-79%', value: buckets.mid },
      { name: '80-89%', value: buckets.high },
      { name: '≥90%', value: buckets.excellent },
    ]
  }, [quizForAnalysis])

  const classComparisonData = useMemo(() => {
    const allClasses = getClasses()
    return allClasses.map((cls) => {
      const records = getQuizRecordsByClass(cls.id)
      let wordSum = 0
      let wordCount = 0
      let grammarSum = 0
      let grammarCount = 0
      for (const r of records) {
        if (r.wordScore != null && r.wordTotal != null && r.wordTotal > 0) {
          wordSum += (r.wordScore / r.wordTotal) * 100
          wordCount++
        }
        if (r.grammarScore != null && r.grammarTotal != null && r.grammarTotal > 0) {
          grammarSum += (r.grammarScore / r.grammarTotal) * 100
          grammarCount++
        }
      }
      return {
        name: cls.name,
        word: wordCount > 0 ? Math.round((wordSum / wordCount) * 10) / 10 : 0,
        grammar: grammarCount > 0 ? Math.round((grammarSum / grammarCount) * 10) / 10 : 0,
      }
    }).filter((d) => d.word > 0 || d.grammar > 0)
  }, [])

  const studentRecords = useMemo(() => {
    if (!selectedStudentId) return []
    const records = getQuizRecordsByStudent(selectedStudentId)
      .filter((r) => r.overallAccuracy != null || (r.wordScore != null && r.wordTotal != null && r.wordTotal > 0))
      .sort((a, b) => new Date(b.assessedAt).getTime() - new Date(a.assessedAt).getTime())
    return records.slice(0, 10).reverse()
  }, [selectedStudentId])

  const studentChartData = useMemo(() => {
    return studentRecords.map((r, i) => {
      let acc = r.overallAccuracy
      if (acc == null && r.wordScore != null && r.wordTotal != null && r.wordTotal > 0) {
        acc = Math.round((r.wordScore / r.wordTotal) * 1000) / 10
      }
      return {
        index: i + 1,
        label: `第${i + 1}次`,
        accuracy: acc || 0,
      }
    })
  }, [studentRecords])

  const studentDelta = useMemo(() => {
    if (studentChartData.length < 2) return null
    const first = studentChartData[0].accuracy
    const last = studentChartData[studentChartData.length - 1].accuracy
    return Math.round((last - first) * 10) / 10
  }, [studentChartData])

  const filteredStudents = useMemo(() => {
    let list = students
    if (filterClassId !== 'all') {
      list = getStudentsByClass(filterClassId)
    }
    if (studentSearch.trim()) {
      const q = studentSearch.trim().toLowerCase()
      list = list.filter((s) => s.name.toLowerCase().includes(q))
    }
    return list
  }, [students, filterClassId, studentSearch])

  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || null
  }, [students, selectedStudentId])

  const classOptions = useMemo(() => {
    return [{ id: 'all', name: '全部班级' }, ...classes.map((c) => ({ id: c.id, name: c.name }))]
  }, [classes])

  return (
    <PageContainer>
      <div className="space-y-6 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">数据看板</h1>
              <p className="text-xs text-muted-foreground mt-0.5">教学数据分析与可视化</p>
            </div>
          </div>
          <select
            value={filterClassId}
            onChange={(e) => setFilterClassId(e.target.value)}
            className="h-10 px-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {classOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-1 bg-accent/50 rounded-xl p-1 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <BookOpen className="h-3.5 w-3.5" />
                  班级总数
                </div>
                <p className="text-2xl font-bold text-foreground">{classes.length}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Users className="h-3.5 w-3.5" />
                  学生总数
                </div>
                <p className="text-2xl font-bold text-foreground">{totalStudents}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <FileText className="h-3.5 w-3.5" />
                  本月记录数
                </div>
                <p className="text-2xl font-bold text-foreground">{thisMonthRecords}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Target className="h-3.5 w-3.5" />
                  平均正确率
                </div>
                <p className="text-2xl font-bold text-foreground">{averageAccuracy}%</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm">
              <h3 className="font-semibold text-foreground text-sm mb-4">各班平均正确率对比</h3>
              {classBarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={classBarData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => [`${value}%`, '正确率']}
                    />
                    <Bar dataKey="accuracy" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">暂无数据</p>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm">
              <h3 className="font-semibold text-foreground text-sm mb-4">近30天正确率趋势</h3>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => [`${value}%`, '正确率']}
                    />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">暂无数据</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm">
              <h3 className="font-semibold text-foreground text-sm mb-4">词汇正确率分布</h3>
              {wordAccuracyData.some((d) => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={wordAccuracyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                    >
                      {wordAccuracyData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => [`${value} 条记录`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">暂无数据</p>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm">
              <h3 className="font-semibold text-foreground text-sm mb-4">各班词汇/语法正确率对比</h3>
              {classComparisonData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={classComparisonData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => [`${value}%`, '']}
                    />
                    <Legend />
                    <Bar dataKey="word" name="词汇正确率" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="grammar" name="语法正确率" fill="#82ca9d" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">暂无数据</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm">
              <h3 className="font-semibold text-foreground text-sm mb-4">选择学生</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="搜索学生姓名..."
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">-- 请选择学生 --</option>
                  {filteredStudents.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedStudent && (
              <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{selectedStudent.name}</h3>
                    <p className="text-xs text-muted-foreground">近 10 次小测正确率变化</p>
                  </div>
                  {studentDelta !== null && (
                    <div className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${
                      studentDelta >= 0
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      {studentDelta >= 0 ? '+' : ''}{studentDelta}%
                    </div>
                  )}
                </div>

                {studentChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={studentChartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number) => [`${value}%`, '正确率']}
                      />
                      <Line
                        type="monotone"
                        dataKey="accuracy"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-12">暂无小测记录</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
