'use client'

import React from 'react'
import { CalendarCheck, CalendarX, Percent } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AttendanceCardProps {
  totalLessons: number
  absenceCount: number
  absenceDates: string[]
}

export function AttendanceCard({ totalLessons, absenceCount, absenceDates }: AttendanceCardProps) {
  const attended = Math.max(totalLessons - absenceCount, 0)
  const rate = totalLessons > 0 ? Math.round((attended / totalLessons) * 100) : 0

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-5">
        <CalendarCheck className="h-4 w-4 text-green-600" />
        出勤统计
      </h2>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{attended}</div>
          <div className="text-xs text-muted-foreground mt-1">出勤</div>
        </div>
        <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{absenceCount}</div>
          <div className="text-xs text-muted-foreground mt-1">缺勤</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {rate}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">出勤率</div>
        </div>
      </div>

      {totalLessons > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>出勤进度</span>
            <span>{attended}/{totalLessons} 次</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                rate >= 90 ? 'bg-green-500' : rate >= 75 ? 'bg-yellow-500' : 'bg-red-500',
              )}
              style={{ width: `${rate}%` }}
            />
          </div>
        </div>
      )}

      {absenceDates.length > 0 && (
        <div className="flex items-start gap-2">
          <CalendarX className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground mb-1">缺勤日期</p>
            <div className="flex flex-wrap gap-1.5">
              {absenceDates.map(d => (
                <span
                  key={d}
                  className="text-xs px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
