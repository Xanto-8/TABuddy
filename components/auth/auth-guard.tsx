'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth-store'
import { usePathname, useRouter } from 'next/navigation'

const PUBLIC_PATHS = ['/auth/login', '/intro']

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const hasRedirected = useRef(false)
  const [mounted, setMounted] = useState(false)

  const isPublicPath = PUBLIC_PATHS.some(path => pathname?.startsWith(path))

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (hasRedirected.current) return

    if (!isAuthenticated && !isPublicPath) {
      hasRedirected.current = true
      router.replace('/auth/login')
    }
  }, [mounted, isAuthenticated, isPublicPath, router])

  if (!mounted) {
    return <div className="hidden" />
  }

  if (isPublicPath) {
    return <>{children}</>
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
