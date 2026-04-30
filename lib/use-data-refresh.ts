'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseDataRefreshOptions {
  interval?: number
  enabled?: boolean
  onRefresh: () => void
}

export function useDataRefresh({
  interval = 30000,
  enabled = false,
  onRefresh,
}: UseDataRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const onRefreshRef = useRef(onRefresh)
  onRefreshRef.current = onRefresh

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = undefined
      }
      return
    }
    timerRef.current = setInterval(() => {
      onRefreshRef.current()
    }, interval)
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = undefined
      }
    }
  }, [interval, enabled])

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await Promise.resolve(onRefreshRef.current())
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  return { isRefreshing, refresh }
}
