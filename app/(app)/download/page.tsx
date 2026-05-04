'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PageContainer } from '@/components/ui/page-container'
import { Button } from '@/components/ui/button'
import { Download, Monitor, CheckCircle, ChevronRight, ExternalLink, Github } from 'lucide-react'

const DOWNLOAD_URL = 'https://share.feijipan.com/s/4Y4lrRlU'

export default function DownloadPage() {
  const [downloaded, setDownloaded] = useState(false)

  useEffect(() => {
    const referred = sessionStorage.getItem('tabuddy_download_referred')
    if (referred === 'true') {
      sessionStorage.removeItem('tabuddy_download_referred')
    }
  }, [])

  const handleDownload = () => {
    setDownloaded(true)
    window.open(DOWNLOAD_URL, '_blank')
    setTimeout(() => setDownloaded(false), 3000)
  }

  return (
    <PageContainer>
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Download className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">下载客户端</h1>
            <p className="text-sm text-muted-foreground">下载 TABuddy 桌面客户端，获得更流畅的使用体验</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-start gap-6">
                  <div className="shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Monitor className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-foreground">TABuddy 桌面客户端</h2>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">v1.0.0</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 font-medium">最新版本</span>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                      专为 Windows 打造的桌面客户端，支持桌面通知、系统托盘、全局快捷键等高级功能，带来更高效的办公体验。
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    '原生桌面通知，不再错过任何消息',
                    '系统托盘常驻，后台运行不干扰',
                    '全局快捷键，快速启动常用功能',
                    '自动更新提醒，始终保持最新版本',
                    '独立窗口体验，比浏览器更流畅',
                    '更稳定的长连接和实时通信',
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex items-center gap-4">
                  <Button
                    size="lg"
                    onClick={handleDownload}
                    className="gap-2 min-w-[200px] text-base h-12"
                  >
                    <Download className="w-5 h-5" />
                    {downloaded ? '下载中...' : '下载 Windows 版'}
                  </Button>
                  <span className="text-xs text-muted-foreground">Windows 7+ / 64位</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="mt-6 rounded-xl border border-border bg-card p-6"
            >
              <h3 className="text-sm font-semibold text-foreground mb-3">安装说明</h3>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                  <span>点击上方「下载 Windows 版」按钮，下载安装包</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                  <span>双击运行 <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">TABuddy Setup.exe</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                  <span>按照安装向导完成安装，启动后即可开始使用</span>
                </li>
              </ol>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <h3 className="text-sm font-semibold text-foreground mb-4">系统要求</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">操作系统</dt>
                  <dd className="text-foreground font-medium">Windows 7+</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">架构</dt>
                  <dd className="text-foreground font-medium">x64 (64位)</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">内存</dt>
                  <dd className="text-foreground font-medium">≥ 2GB</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">磁盘</dt>
                  <dd className="text-foreground font-medium">≥ 200MB</dd>
                </div>
              </dl>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <h3 className="text-sm font-semibold text-foreground mb-3">其他版本</h3>
              <p className="text-sm text-muted-foreground mb-4">更多平台版本即将推出</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 opacity-50">
                  <Github className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-foreground">macOS 版</p>
                    <p className="text-xs text-muted-foreground">即将推出</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 opacity-50">
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-foreground">网页版</p>
                    <p className="text-xs text-muted-foreground">随时可用</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
