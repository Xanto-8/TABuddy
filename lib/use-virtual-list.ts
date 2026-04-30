'use client'

import { useState, useRef, useCallback, useMemo, useEffect } from 'react'

interface UseVirtualListOptions<T> {
  items: T[]
  itemHeight: number
  overscan?: number
  containerHeight: number
}

interface VirtualItem<T> {
  item: T
  index: number
  style: React.CSSProperties
  offsetTop: number
}

export function useVirtualList<T>({
  items,
  itemHeight,
  overscan = 5,
  containerHeight,
}: UseVirtualListOptions<T>): {
  virtualItems: VirtualItem<T>[]
  totalHeight: number
  scrollRef: React.RefObject<HTMLDivElement | null>
  scrollTo: (index: number) => void
} {
  const [scrollTop, setScrollTop] = useState(0)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      setScrollTop(scrollRef.current.scrollTop)
    }
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const totalHeight = items.length * itemHeight

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan)

  const virtualItems = useMemo(() => {
    const result: VirtualItem<T>[] = []
    for (let i = startIndex; i < endIndex; i++) {
      result.push({
        item: items[i],
        index: i,
        offsetTop: i * itemHeight,
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: itemHeight,
          transform: `translateY(${i * itemHeight}px)`,
          willChange: 'transform',
        } as React.CSSProperties,
      })
    }
    return result
  }, [items, startIndex, endIndex, itemHeight])

  const scrollTo = useCallback((index: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = index * itemHeight
    }
  }, [itemHeight])

  return { virtualItems, totalHeight, scrollRef, scrollTo }
}
