'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/lib/auth-store'
import { GuideModal } from './guide-modal'
import { SurveyModal } from './survey-modal'

export function GuideGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, getToken, updateUser } = useAuth()
  const [showGuide, setShowGuide] = useState(false)
  const [showSurvey, setShowSurvey] = useState(false)
  const [guideUrl, setGuideUrl] = useState('')
  const [surveyUrl, setSurveyUrl] = useState('')
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

    const checkModals = async () => {
      hasChecked.current = true
      try {
        const token = getToken()

        const guideRes = await fetch('/api/guide/check', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const guideResult = await guideRes.json()

        if (guideResult.data) {
          const { hasReadGuide, role, guideUrl: url } = guideResult.data

          if (!hasReadGuide && (role === 'classadmin' || role === 'superadmin' || role === 'assistant')) {
            setGuideUrl(url || '')
            setUserRole(role)
            setShowGuide(true)
            setChecking(false)
            return
          }
        }

        const surveyRes = await fetch('/api/survey/check', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const surveyResult = await surveyRes.json()

        if (surveyResult.data) {
          const { shouldShow, surveyUrl: surl } = surveyResult.data
          if (shouldShow && surl) {
            setSurveyUrl(surl)
            setShowSurvey(true)
          }
        }
      } catch (error) {
        console.error('[GuideGuard] check error:', error)
      } finally {
        setChecking(false)
      }
    }

    checkModals()
  }, [isAuthenticated, user, getToken])

  const handleGuideConfirm = async () => {
    try {
      const token = getToken()
      const res = await fetch('/api/guide/read', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await res.json()

      if (res.ok) {
        setShowGuide(false)
        updateUser({ hasReadGuide: true })

        const surveyRes = await fetch('/api/survey/check', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const surveyResult = await surveyRes.json()

        if (surveyResult.data) {
          const { shouldShow, surveyUrl: surl } = surveyResult.data
          if (shouldShow && surl) {
            setSurveyUrl(surl)
            setShowSurvey(true)
          }
        }
      } else {
        console.error('[GuideGuard] guide confirm error:', result.error)
      }
    } catch (error) {
      console.error('[GuideGuard] guide confirm error:', error)
    }
  }

  const handleSurveyConfirm = async () => {
    try {
      const token = getToken()
      const res = await fetch('/api/survey/submit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await res.json()

      if (res.ok) {
        setShowSurvey(false)
        updateUser({ hasFillSurvey: true })
      } else {
        console.error('[GuideGuard] survey confirm error:', result.error)
      }
    } catch (error) {
      console.error('[GuideGuard] survey confirm error:', error)
    }
  }

  if (checking) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {children}
      {showGuide && guideUrl && (
        <GuideModal
          guideUrl={guideUrl}
          role={userRole}
          onConfirm={handleGuideConfirm}
        />
      )}
      {!showGuide && showSurvey && surveyUrl && (
        <SurveyModal
          surveyUrl={surveyUrl}
          onConfirm={handleSurveyConfirm}
        />
      )}
    </>
  )
}
