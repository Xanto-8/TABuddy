'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/lib/auth-store'
import { GuideModal } from './guide-modal'

export function GuideGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, getToken } = useAuth()
  const [showGuide, setShowGuide] = useState(false)
  const [guideUrl, setGuideUrl] = useState('')
  const [userRole, setUserRole] = useState('')
  const [checking, setChecking] = useState(true)
  const hasChecked = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || !user || hasChecked.current) {
      if (!isAuthenticated) {
        setChecking(false)
      }
      return
    }

    const checkGuide = async () => {
      hasChecked.current = true
      try {
        const token = getToken()
        const res = await fetch('/api/guide/check', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const result = await res.json()

        if (result.data) {
          const { hasReadGuide, role, guideUrl: url } = result.data

          if (!hasReadGuide && (role === 'classadmin' || role === 'superadmin' || role === 'assistant')) {
            setGuideUrl(url || '')
            setUserRole(role)
            setShowGuide(true)
          }
        }
      } catch (error) {
        console.error('[GuideGuard] check error:', error)
      } finally {
        setChecking(false)
      }
    }

    checkGuide()
  }, [isAuthenticated, user, getToken])

  const handleConfirm = async () => {
    try {
      const token = getToken()
      const res = await fetch('/api/guide/read', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await res.json()

      if (res.ok) {
        setShowGuide(false)
      } else {
        console.error('[GuideGuard] confirm error:', result.error)
      }
    } catch (error) {
      console.error('[GuideGuard] confirm error:', error)
    }
  }

  return (
    <>
      {children}
      {showGuide && guideUrl && (
        <GuideModal
          guideUrl={guideUrl}
          role={userRole}
          onConfirm={handleConfirm}
        />
      )}
    </>
  )
}
