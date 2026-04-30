'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Press_Start_2P } from 'next/font/google'
import { cn } from '@/lib/utils'
import { History, ChevronDown, ChevronUp, Zap } from 'lucide-react'

const pixelFont = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
})

interface FocusSession {
  date: string
  duration: number
  startedAt: number
}

interface FocusTimerProps {
  defaultMinutes?: number
  className?: string
}

const STORAGE_KEY = 'focus-timer-sessions'
const SVG_SIZE = 220
const SVG_RADIUS = 90
const SVG_STROKE = 7
const CIRCUMFERENCE = 2 * Math.PI * SVG_RADIUS
const PRESET_TIMES = [5, 15, 25, 30, 45, 60]

function getToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getWeekStart(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}秒`
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) return `${hours}h${minutes > 0 ? minutes : ''}`
  return `${minutes}分钟`
}

function loadSessions(): FocusSession[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const sessions: FocusSession[] = raw ? JSON.parse(raw) : []
    return sessions.map((s) => ({
      ...s,
      startedAt: s.startedAt ?? new Date(s.date + 'T00:00:00').getTime(),
    }))
  } catch {
    return []
  }
}

function saveSessions(sessions: FocusSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  } catch {}
}

function getStats(sessions: FocusSession[]) {
  const today = getToday()
  const weekStart = getWeekStart()

  let todayTotal = 0
  let weekTotal = 0
  let cumulativeTotal = 0

  for (const s of sessions) {
    cumulativeTotal += s.duration
    if (s.date >= weekStart) weekTotal += s.duration
    if (s.date === today) todayTotal += s.duration
  }

  return { todayTotal, weekTotal, cumulativeTotal }
}

export function FocusTimer({ defaultMinutes = 25, className }: FocusTimerProps) {
  const [customMinutes, setCustomMinutes] = useState(defaultMinutes)
  const totalTime = customMinutes * 60
  const [timeLeft, setTimeLeft] = useState(totalTime)
  const [isRunning, setIsRunning] = useState(false)
  const [sessions, setSessions] = useState<FocusSession[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [showRecords, setShowRecords] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevDisplayRef = useRef('')
  const sessionsRef = useRef<FocusSession[]>([])

  const display = formatTime(timeLeft)
  const progress = totalTime > 0 ? 1 - timeLeft / totalTime : 0
  const offset = CIRCUMFERENCE * (1 - Math.min(progress, 1))

  const isIdle = !isRunning && !isCompleted

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => b.startedAt - a.startedAt)
  }, [sessions])

  useEffect(() => {
    setIsVisible(true)
    const loaded = loadSessions()
    setSessions(loaded)
    sessionsRef.current = loaded
  }, [])

  useEffect(() => {
    if (display !== prevDisplayRef.current) {
      prevDisplayRef.current = display
      setIsShaking(true)
      const t = setTimeout(() => setIsShaking(false), 150)
      return () => clearTimeout(t)
    }
  }, [display])

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false)
          setIsCompleted(true)
          if (intervalRef.current) clearInterval(intervalRef.current)

          const now = Date.now()
          const session: FocusSession = {
            date: getToday(),
            duration: totalTime,
            startedAt: now,
          }
          sessionsRef.current = [...sessionsRef.current, session]
          setSessions(sessionsRef.current)
          saveSessions(sessionsRef.current)

          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, totalTime])

  const handleStartPause = useCallback(() => {
    if (isCompleted) {
      setTimeLeft(totalTime)
      setIsCompleted(false)
    }
    setIsRunning((prev) => !prev)
  }, [isCompleted, totalTime])

  const handleReset = useCallback(() => {
    setIsRunning(false)
    setIsCompleted(false)
    setTimeLeft(totalTime)
  }, [totalTime])

  const handlePresetSelect = useCallback((minutes: number) => {
    setCustomMinutes(minutes)
    setTimeLeft(minutes * 60)
    setIsCompleted(false)
    setIsRunning(false)
  }, [])

  const stats = useRef(getStats(sessions))
  stats.current = getStats(sessions)

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border transition-all duration-500',
        'bg-card/60 backdrop-blur-xl border-border/50 shadow-lg',
        'p-6 sm:p-8',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        className
      )}
    >
      <style>
        {`
          @keyframes pixel-shake {
            0% { transform: translateX(0) scale(1); }
            20% { transform: translateX(-1px) scale(1.01); }
            40% { transform: translateX(1px) scale(0.99); }
            60% { transform: translateX(-0.5px) scale(1.005); }
            80% { transform: translateX(0.5px) scale(0.995); }
            100% { transform: translateX(0) scale(1); }
          }
          @keyframes breathe {
            0%, 100% { opacity: 0.75; }
            50% { opacity: 1; }
          }
          @keyframes pulse-complete {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
          @keyframes scanline {
            0% { background-position: 0 0; }
            100% { background-position: 0 4px; }
          }
          .animate-pixel-shake {
            animation: pixel-shake 0.15s ease-out;
          }
          .animate-breathe {
            animation: breathe 2.5s ease-in-out infinite;
          }
          .animate-pulse-complete {
            animation: pulse-complete 1s ease-in-out 3;
          }
        `}
      </style>

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.08) 2px, rgba(255,255,255,0.08) 4px)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-5">
        <div className="flex items-center gap-4 text-xs text-muted-foreground/80">
          {stats.current.todayTotal > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              今日 +{formatDuration(stats.current.todayTotal)}
            </span>
          )}
          {stats.current.weekTotal > 0 && (
            <span>本周 {formatDuration(stats.current.weekTotal)}</span>
          )}
          {stats.current.cumulativeTotal > 0 && (
            <span>累计 {formatDuration(stats.current.cumulativeTotal)}</span>
          )}
          {stats.current.cumulativeTotal === 0 && (
            <span className="text-muted-foreground/50">开始你的第一次专注</span>
          )}
        </div>

        {isIdle && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {PRESET_TIMES.map((min) => (
              <button
                key={min}
                onClick={() => handlePresetSelect(min)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                  'active:scale-95',
                  customMinutes === min
                    ? 'bg-primary/20 text-primary border border-primary/30 shadow-sm'
                    : 'text-muted-foreground border border-border/60 hover:border-primary/40 hover:text-primary hover:bg-primary/5'
                )}
              >
                {min}分
              </button>
            ))}
          </div>
        )}

        <div className="relative flex items-center justify-center w-[220px] h-[220px]">
          <svg
            width={SVG_SIZE}
            height={SVG_SIZE}
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            className="-rotate-90"
          >
            <circle
              cx={SVG_SIZE / 2}
              cy={SVG_SIZE / 2}
              r={SVG_RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth={SVG_STROKE}
              className="text-border"
              strokeLinecap="round"
            />
            <circle
              cx={SVG_SIZE / 2}
              cy={SVG_SIZE / 2}
              r={SVG_RADIUS}
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth={SVG_STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              className={cn(
                'transition-all duration-1000 ease-linear',
                isRunning && !isCompleted && 'animate-breathe'
              )}
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--secondary))" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={cn(
                pixelFont.className,
                'select-none',
                isCompleted ? 'text-green-500 animate-pulse-complete' : 'text-foreground',
                isShaking && !isCompleted && 'animate-pixel-shake',
                isRunning ? 'text-base sm:text-lg' : 'text-sm sm:text-base',
                'transition-colors duration-300'
              )}
            >
              {display}
            </span>
          </div>
        </div>

        {isIdle && (
          <div className="text-[11px] text-muted-foreground/60 -mt-2">
            专注 {customMinutes} 分钟
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleStartPause}
            className={cn(
              'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium',
              'transition-all duration-200 active:scale-95 hover:scale-[1.03]',
              isRunning
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                : 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30'
            )}
          >
            {isCompleted
              ? '重新开始'
              : isRunning
              ? '暂停'
              : '开始专注'}
          </button>
          <button
            onClick={handleReset}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium',
              'transition-all duration-200 active:scale-95 hover:scale-[1.03]',
              'text-muted-foreground border border-border hover:bg-accent/50 hover:text-foreground'
            )}
          >
            重置
          </button>
        </div>

        {sessions.length > 0 && (
          <div className="w-full border-t border-border/40 pt-4 mt-1">
            <button
              onClick={() => setShowRecords((prev) => !prev)}
              className="flex items-center justify-between w-full text-xs text-muted-foreground/70 hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" />
                专注记录
                <span className="text-muted-foreground/40">({sessions.length})</span>
              </span>
              {showRecords ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>

            {showRecords && (
              <div className="mt-3 space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                {sortedSessions.slice(0, 30).map((session, idx) => {
                  const timeStr = new Date(session.startedAt).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  return (
                    <div
                      key={`${session.startedAt}-${idx}`}
                      className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-accent/30 text-xs"
                    >
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Zap className="h-3 w-3 text-primary/60" />
                        <span>{session.date}</span>
                        <span className="text-muted-foreground/50">{timeStr}</span>
                      </span>
                      <span className="font-medium text-foreground/80">
                        {formatDuration(session.duration)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
