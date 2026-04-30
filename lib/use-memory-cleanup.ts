'use client'

import { useEffect, useRef } from 'react'

export function useMemoryCleanup(
  cleanup: () => void,
  deps: unknown[] = []
) {
  const cleanupRef = useRef(cleanup)
  cleanupRef.current = cleanup

  useEffect(() => {
    const currentCleanup = cleanupRef.current
    return () => {
      currentCleanup()
      if (typeof window !== 'undefined' && window.gc) {
        try {
          window.gc()
        } catch {
          /* not available */
        }
      }
    }
  }, deps)
}
