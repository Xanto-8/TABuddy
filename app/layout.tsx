import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import { Toaster } from 'sonner'
import { ProgressProvider } from '@/components/providers/progress-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { SidebarProvider } from '@/components/providers/sidebar-provider'
import { NotificationProvider } from '@/components/notification/notification-provider'
import { AuthProvider } from '@/lib/auth-store'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'TABuddy - 新东方助教效率工具',
    template: '%s | TABuddy',
  },
  description: '帮助新东方国际教育助教提升工作效率的智能工具',
  keywords: ['教育', '助教', '效率工具', '新东方', 'GY', 'KET'],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TABuddy',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <AuthProvider>
            <ProgressProvider>
            <NotificationProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
            </NotificationProvider>
            </ProgressProvider>
            <Toaster 
              position="top-right"
              toastOptions={{
                className: 'font-sans',
                duration: 4000,
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
