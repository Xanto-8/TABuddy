'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/auth/auth-guard'
import { GuideGuard } from '@/components/guide/guide-guard'
import { Sidebar } from '@/components/layout/sidebar'
import { ContentArea } from '@/components/layout/content-area'
import { FloatingChatAssistant } from '@/components/floating-chat/floating-chat-assistant'
import { DataLoadingScreen } from '@/components/layout/data-loading-screen'
import { isCacheLoaded } from '@/lib/store'
import { ShortcutStoreProvider } from '@/lib/shortcut-store'
import { ShortcutProvider, useRegisterShortcut } from '@/lib/shortcut-context'
import { CopyShortcutProvider } from '@/lib/copy-shortcut'

function NavigationShortcuts() {
  const router = useRouter()

  useRegisterShortcut('nav-homework', () => {
    router.push('/homework')
  })

  useRegisterShortcut('nav-quiz', () => {
    router.push('/quizzes')
  })

  useRegisterShortcut('nav-feedback', () => {
    router.push('/feedback')
  })

  useRegisterShortcut('nav-classes', () => {
    router.push('/classes')
  })

  return null
}

function AppContent({ children }: { children: React.ReactNode }) {
  const [dataReady, setDataReady] = useState(false)

  useEffect(() => {
    if (isCacheLoaded()) {
      setDataReady(true)
      return
    }
    const handler = () => setDataReady(true)
    window.addEventListener('appDataReady', handler)
    return () => window.removeEventListener('appDataReady', handler)
  }, [])

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <ContentArea>
        <AnimatePresence mode="wait">
          {dataReady ? (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          ) : (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <DataLoadingScreen />
            </motion.div>
          )}
        </AnimatePresence>
      </ContentArea>
    </div>
  )
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <GuideGuard>
        <ShortcutStoreProvider>
          <ShortcutProvider>
            <CopyShortcutProvider>
              <NavigationShortcuts />
              <AppContent>{children}</AppContent>
            </CopyShortcutProvider>
          </ShortcutProvider>
        </ShortcutStoreProvider>
      </GuideGuard>
      <FloatingChatAssistant />
    </AuthGuard>
  )
}
