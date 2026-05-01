'use client'

import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { PageContainer } from '@/components/ui/page-container'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-store'
import { useTheme } from 'next-themes'
import { getKnowledgeBase } from '@/lib/knowledge-base-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { User, Shield, Sun, Moon, Bell, BellRing, BookOpen, Lock, Mail, Smartphone, Download, Eye, EyeOff, Camera } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()

  return (
    <PageContainer>
      <div className="space-y-8 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">设置</h1>
          <p className="text-muted-foreground mt-1">管理个人信息、系统偏好与数据安全</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <ProfileSection user={user} />
          <SystemSettingsSection theme={theme} setTheme={setTheme} />
          <DataSecuritySection user={user} />
        </motion.div>
      </div>
    </PageContainer>
  )
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-muted/30">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5">
        {children}
      </div>
    </div>
  )
}

function ProfileSection({ user }: { user: { username: string; role?: string; avatar?: string } | null }) {
  const { updateAvatar, getToken } = useAuth()
  const [nickname, setNickname] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOldPwd, setShowOldPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [savingName, setSavingName] = useState(false)
  const [changingPwd, setChangingPwd] = useState(false)
  const [loginTime] = useState(() => new Date().toLocaleString('zh-CN'))
  const [avatarError, setAvatarError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isSuperAdmin = user?.role === 'superadmin'
  const profileLabel = isSuperAdmin ? '超级管理员' : user?.role === 'classadmin' ? '班级管理员' : '助教'
  const displayName = nickname || (isSuperAdmin ? '超级管理员' : user?.role === 'classadmin' ? '班级管理员' : '助教')

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      updateAvatar(dataUrl)
      setAvatarError(false)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleSaveName = async () => {
    if (!nickname.trim()) {
      toast.error('请输入昵称')
      return
    }
    setSavingName(true)
    await new Promise(r => setTimeout(r, 400))
    setSavingName(false)
    toast.success('昵称已更新')
  }

  const handleChangePassword = async () => {
    if (!oldPassword) { toast.error('请输入当前密码'); return }
    if (!newPassword) { toast.error('请输入新密码'); return }
    if (newPassword !== confirmPassword) { toast.error('两次输入的新密码不一致'); return }
    if (newPassword.length < 6) { toast.error('新密码至少6位'); return }
    setChangingPwd(true)
    try {
      const token = getToken()
      if (!token) { toast.error('未登录'); return }
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      })
      const result = await res.json()
      if (result.data) {
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
        toast.success('密码修改成功')
      } else {
        toast.error(result.error || '修改失败')
      }
    } catch {
      toast.error('网络错误')
    } finally {
      setChangingPwd(false)
    }
  }

  return (
    <SectionCard title="个人信息" description="管理你的个人资料和登录信息">
      <div className="space-y-6">
        <div className="flex items-center gap-5">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            {user?.avatar && !avatarError ? (
              <div className="h-16 w-16 rounded-full overflow-hidden">
                <img
                  src={user.avatar}
                  alt="头像"
                  className="h-full w-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              </div>
            ) : (
              <div className={cn(
                'h-16 w-16 rounded-full flex items-center justify-center shrink-0 text-2xl',
                isSuperAdmin
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-gradient-to-r from-primary to-secondary text-white'
              )}>
                {isSuperAdmin ? <Shield className="w-7 h-7" /> : <User className="w-7 h-7" />}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">{displayName}</p>
            <p className="text-sm text-muted-foreground">@{user?.username}</p>
          </div>
          <div className="ml-auto hidden sm:block">
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
              {profileLabel}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-muted/40 border border-border/50">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">账号</p>
            <p className="text-sm font-medium text-foreground">{user?.username}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">所属机构</p>
            <p className="text-sm font-medium text-foreground">新东方国际教育</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">当前登录</p>
            <p className="text-sm font-medium text-foreground">{loginTime}</p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-foreground mb-1.5">昵称 / 姓名</label>
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="输入你的昵称"
                className="w-full h-10 px-4 text-sm rounded-xl border border-input bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <Button size="sm" onClick={handleSaveName} disabled={savingName || !nickname.trim()}>
              {savingName ? '保存中...' : '保存'}
            </Button>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-sm font-medium text-foreground mb-3">修改密码</p>
            <div className="space-y-3">
              <div className="relative">
                <label className="block text-xs text-muted-foreground mb-1">当前密码</label>
                <div className="relative">
                  <input
                    type={showOldPwd ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    placeholder="输入当前密码"
                    className="w-full h-10 px-4 pr-10 text-sm rounded-xl border border-input bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPwd(!showOldPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showOldPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block text-xs text-muted-foreground mb-1">新密码</label>
                  <div className="relative">
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="新密码（至少6位）"
                      className="w-full h-10 px-4 pr-10 text-sm rounded-xl border border-input bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">确认新密码</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="再次输入新密码"
                    className="w-full h-10 px-4 text-sm rounded-xl border border-input bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleChangePassword}
                  disabled={changingPwd || !oldPassword || !newPassword || !confirmPassword}
                >
                  {changingPwd ? '修改中...' : '修改密码'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

function SystemSettingsSection({ theme, setTheme }: { theme: string | undefined; setTheme: (theme: string) => void }) {
  const [notifications, setNotifications] = useState({
    assistant: true,
    classReminder: true,
    homeworkReminder: true,
  })

  return (
    <SectionCard title="系统设置" description="自定义界面偏好与消息通知">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              {theme === 'dark' ? <Moon className="w-5 h-5 text-amber-600 dark:text-amber-400" /> : <Sun className="w-5 h-5 text-amber-600" />}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">外观模式</p>
              <p className="text-xs text-muted-foreground">{theme === 'dark' ? '深色模式' : '浅色模式'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted border border-border">
            <button
              onClick={() => setTheme('light')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all ${theme !== 'dark' ? 'bg-background shadow-sm text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Sun className="w-3.5 h-3.5 inline-block mr-1" />
              浅色
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all ${theme === 'dark' ? 'bg-background shadow-sm text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Moon className="w-3.5 h-3.5 inline-block mr-1" />
              深色
            </button>
          </div>
        </div>

        <div className="border-t border-border pt-5">
          <div className="flex items-center gap-2 mb-4">
            <BellRing className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">消息通知设置</p>
          </div>
          <div className="space-y-3">
            <ToggleRow
              icon={<Bell className="w-4 h-4" />}
              label="助手消息"
              description="接收英语助教助手的智能回复与提醒"
              checked={notifications.assistant}
              onChange={v => setNotifications(p => ({ ...p, assistant: v }))}
            />
            <ToggleRow
              icon={<BookOpen className="w-4 h-4" />}
              label="班级提醒"
              description="班级排课变动、考勤状态更新"
              checked={notifications.classReminder}
              onChange={v => setNotifications(p => ({ ...p, classReminder: v }))}
            />
            <ToggleRow
              icon={<Download className="w-4 h-4" />}
              label="作业提醒"
              description="作业提交、批改完成、未交提醒"
              checked={notifications.homeworkReminder}
              onChange={v => setNotifications(p => ({ ...p, homeworkReminder: v }))}
            />
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

function ToggleRow({ icon, label, description, checked, onChange }: {
  icon: React.ReactNode; label: string; description: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-primary' : 'bg-muted-foreground/30'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )
}

function DataSecuritySection({ user }: { user: { username: string; role?: string } | null }) {
  const [exporting, setExporting] = useState(false)

  const handleExportKB = async () => {
    setExporting(true)
    await new Promise(r => setTimeout(r, 600))
    try {
      const kb = getKnowledgeBase()
      const blob = new Blob([JSON.stringify(kb, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tabuddy_knowledge_base_${user?.username}_${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('知识库已导出')
    } catch {
      toast.error('导出失败')
    }
    setExporting(false)
  }

  return (
    <SectionCard title="数据与安全" description="备份数据和管理账号安全选项">
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">私有知识库</p>
              <p className="text-xs text-muted-foreground">导出你的私有知识库数据为 JSON 文件</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportKB} disabled={exporting}>
            <Download className="w-4 h-4 mr-1.5" />
            {exporting ? '导出中...' : '导出备份'}
          </Button>
        </div>

        <div className="border-t border-border pt-5">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">账号安全</p>
          </div>
          <div className="space-y-3">
            <SecurityOptionRow
              icon={<Smartphone className="w-4 h-4" />}
              label="绑定手机号"
              description="用于账号找回和身份验证"
              status="未绑定"
              actionLabel="去绑定"
              onAction={() => toast.info('手机号绑定功能开发中')}
            />
            <SecurityOptionRow
              icon={<Mail className="w-4 h-4" />}
              label="绑定邮箱"
              description="接收安全通知和密码找回"
              status="未绑定"
              actionLabel="去绑定"
              onAction={() => toast.info('邮箱绑定功能开发中')}
            />
            <SecurityOptionRow
              icon={<Lock className="w-4 h-4" />}
              label="登录密码"
              description="建议定期更换密码确保账号安全"
              status="已设置"
              statusClass="text-success"
              actionLabel="修改"
              onAction={() => {
                document.querySelector('[placeholder="输入当前密码"]')?.scrollIntoView({ behavior: 'smooth' })
              }}
            />
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

function SecurityOptionRow({
  icon, label, description, status, statusClass, actionLabel, onAction,
}: {
  icon: React.ReactNode; label: string; description: string; status: string; statusClass?: string; actionLabel: string; onAction: () => void
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className={`text-xs ${statusClass || 'text-muted-foreground'}`}>{status}</span>
        <Button variant="ghost" size="sm" className="text-xs h-8 px-3" onClick={onAction}>{actionLabel}</Button>
      </div>
    </div>
  )
}
