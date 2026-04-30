'use client'

import { useSidebar } from '@/components/providers/sidebar-provider'
import { Header } from '@/components/layout/header'
import { GlobalNotificationBar } from '@/components/notification/global-notification-bar'
import { PageTransition } from '@/components/layout/page-transition'
import { cn } from '@/lib/utils'

export function ContentArea({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar()

  return (
    <div
      className={cn(
        'flex flex-col h-screen w-full',
        'transition-[padding] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
        isOpen ? 'lg:pl-[220px]' : 'lg:pl-0'
      )}
      style={{ willChange: 'padding' }}
    >
      <Header />
      <GlobalNotificationBar />
      <main className="flex-1 w-full overflow-auto min-h-0" style={{ position: 'relative', zIndex: 0 }}>
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  )
}
