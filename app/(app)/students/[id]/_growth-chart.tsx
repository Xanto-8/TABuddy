'use client'

import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { TrendingUp } from 'lucide-react'

interface ChartDataPoint {
  date: string
  homework?: number
  quiz?: number
}

interface GrowthChartProps {
  data: ChartDataPoint[]
}

export default function GrowthChart({ data }: GrowthChartProps) {
  if (data.length === 0) return null

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-green-600" />
        正确率趋势
      </h2>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            fontSize={11}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            domain={[0, 100]}
            fontSize={11}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            unit="%"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: 12,
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="homework"
            name="作业正确率"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="quiz"
            name="小测正确率"
            stroke="#7c3aed"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
