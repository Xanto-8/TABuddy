'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/lib/auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Camera, Save, Lock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

function getColor(name?: string) {
  if (!name) return 'bg-primary/10 text-primary'
  const colors = [
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function getInitials(name?: string) {
  if (!name) return '?'
  return name.substring(0, 2).toUpperCase()
}

function getRoleLabel(role?: string) {
  switch (role) {
    case 'superadmin': return '超级管理员'
    case 'classadmin': return '班级管理员'
    case 'assistant': return '助教'
    default: return '学生'
  }
}

export default function SettingsPage() {
  const { user, updateProfile, updateAvatar, getToken } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [username, setUsername] = useState(user?.username || '')
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold">请先登录</h2>
          <Button className="mt-4" onClick={() => router.push('/login')}>
            前往登录
          </Button>
        </div>
      </div>
    )
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: '请选择图片文件' })
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: '图片大小不能超过 2MB' })
      return
    }

    const reader = new FileReader()
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string
      setAvatarPreview(dataUrl)
      await updateAvatar(dataUrl)
      setAvatarPreview(null)
      setMessage({ type: 'success', text: '头像已更新' })
      setTimeout(() => setMessage(null), 3000)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    const fields: { username?: string; displayName?: string } = {}
    if (username !== user.username) {
      fields.username = username
    }
    if (displayName !== user.displayName) {
      fields.displayName = displayName
    }

    if (Object.keys(fields).length === 0) {
      setMessage({ type: 'success', text: '没有需要修改的内容' })
      setSaving(false)
      return
    }

    const ok = await updateProfile(fields)
    if (ok) {
      setMessage({ type: 'success', text: '个人信息已保存' })
      setTimeout(() => setMessage(null), 3000)
    } else {
      setMessage({ type: 'error', text: '保存失败，请重试' })
    }
    setSaving(false)
  }

  const handleChangePassword = async () => {
    router.push('/login?tab=change-password')
  }

  const currentAvatar = avatarPreview || user.avatar || ''

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">个人信息</h1>
        <p className="text-sm text-muted-foreground mt-1">管理你的个人资料和账号信息</p>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            头像
          </CardTitle>
          <CardDescription>点击头像上传新图片（支持 JPG、PNG，最大 2MB）</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {currentAvatar ? (
              <div className="h-20 w-20 rounded-full overflow-hidden ring-2 ring-border group-hover:ring-primary transition-all">
                <img
                  src={currentAvatar}
                  alt="avatar"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className={`h-20 w-20 rounded-full flex items-center justify-center text-xl font-bold ring-2 ring-border group-hover:ring-primary transition-all ${getColor(user.displayName || user.username)}`}>
                {getInitials(user.displayName || user.username)}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user.displayName || user.username}</p>
            <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            基本信息
          </CardTitle>
          <CardDescription>修改你的账号名称和显示昵称</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">用户名（账号名）</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="输入用户名"
            />
            <p className="text-xs text-muted-foreground">修改后下次登录请使用新用户名</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">姓名 / 昵称</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={user.username}
            />
            <p className="text-xs text-muted-foreground">显示在系统中的名称</p>
          </div>

          <div className="pt-2 flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>预览：</span>
            </div>
            <div className="flex items-center gap-2">
              {currentAvatar ? (
                <div className="h-8 w-8 rounded-full overflow-hidden ring-1 ring-border">
                  <img src={currentAvatar} alt="" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${getColor(displayName || username)}`}>
                  {getInitials(displayName || username)}
                </div>
              )}
              <div className="text-sm">
                <p className="font-medium leading-tight">{displayName || username}</p>
                <p className="text-xs text-muted-foreground">@{username}</p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? '保存中...' : '保存修改'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="w-5 h-5" />
            安全设置
          </CardTitle>
          <CardDescription>管理你的账号安全</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">修改密码</p>
              <p className="text-sm text-muted-foreground">建议定期更换密码以保护账号安全</p>
            </div>
            <Button variant="outline" onClick={handleChangePassword}>
              修改密码
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            账号信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border">
              <dt className="text-muted-foreground">用户名</dt>
              <dd className="font-medium">{user.username}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <dt className="text-muted-foreground">显示名称</dt>
              <dd className="font-medium">{user.displayName || '-'}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <dt className="text-muted-foreground">角色</dt>
              <dd>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {getRoleLabel(user.role)}
                </span>
              </dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-muted-foreground">用户 ID</dt>
              <dd className="font-mono text-xs text-muted-foreground">{user.id}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
