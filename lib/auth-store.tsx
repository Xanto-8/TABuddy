'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { toast } from 'sonner'

export interface AuthUser {
  id: string
  username: string
  isAdmin: boolean
  displayName?: string
  role?: string
  org?: string
  avatar?: string
}

export interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  token: string | null
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>
  register: (username: string, password: string) => Promise<void>
  logout: () => void
  getToken: () => string | null
  updateAvatar: (avatarDataUrl: string) => Promise<void>
}

async function verifyTokenFromBackend(token: string): Promise<{ user: AuthUser } | null> {
  try {
    const res = await fetch('/api/auth/verify', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!res.ok) return null
    const result = await res.json()
    return result.data
  } catch {
    return null
  }
}

const AUTH_KEY = 'tabuddy_auth'
const TOKEN_KEY = 'tabuddy_auth_token'

function getAuthFromStorage(): AuthState {
  if (typeof window === 'undefined') {
    return { user: null, isAuthenticated: false, token: null }
  }
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      return { user: null, isAuthenticated: false, token: null }
    }

    const stored = localStorage.getItem(AUTH_KEY)
    if (!stored) {
      return { user: null, isAuthenticated: false, token: null }
    }

    const parsed = JSON.parse(stored)
    if (parsed && parsed.username) {
      return {
        user: parsed,
        isAuthenticated: true,
        token,
      }
    }
    return { user: null, isAuthenticated: false, token: null }
  } catch {
    return { user: null, isAuthenticated: false, token: null }
  }
}

function saveAuth(user: AuthUser, token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(AUTH_KEY, JSON.stringify(user))
  localStorage.setItem(TOKEN_KEY, token)
}

function clearAuth(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_KEY)
  localStorage.removeItem(TOKEN_KEY)
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(getAuthFromStorage)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      verifyTokenFromBackend(token).then(result => {
        if (result) {
          const userData: AuthUser = {
            ...result.user,
            isAdmin: result.user.role === 'admin',
          }
          saveAuth(userData, token)
          setState({ user: userData, isAuthenticated: true, token })
          import('@/lib/store').then(m => m.loadAllDataFromAPI()).catch(console.error)
        } else {
          clearAuth()
          setState({ user: null, isAuthenticated: false, token: null })
        }
      })
    } else {
      setState({ user: null, isAuthenticated: false, token: null })
    }
  }, [])

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    if (!username || !password) {
      toast.error('请输入用户名和密码')
      return false
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error || '登录失败')
        return false
      }

      const { token, user } = result.data
      const userData: AuthUser = {
        id: user.id,
        username: user.username,
        isAdmin: user.role === 'admin',
        displayName: user.displayName,
        role: user.role,
        avatar: user.avatar,
      }

      saveAuth(userData, token)
      setState({ user: userData, isAuthenticated: true, token })

      const { loadAllDataFromAPI } = await import('@/lib/store')
      await loadAllDataFromAPI()

      toast.success('登录成功，欢迎回来！')
      return true
    } catch {
      toast.error('网络错误，请重试')
      return false
    }
  }, [])

  const register = useCallback(async (username: string, password: string): Promise<void> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, displayName: username }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || '注册失败')
      }

      const { token, user } = result.data
      const userData: AuthUser = {
        id: user.id,
        username: user.username,
        isAdmin: user.role === 'admin',
        displayName: user.displayName,
        role: user.role,
      }

      saveAuth(userData, token)
      setState({ user: userData, isAuthenticated: true, token })

      const { loadAllDataFromAPI } = await import('@/lib/store')
      await loadAllDataFromAPI()

      toast.success('注册成功！')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '注册失败'
      toast.error(message)
      throw error
    }
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    setState({ user: null, isAuthenticated: false, token: null })
    toast.info('已退出登录')
  }, [])

  const getToken = useCallback((): string | null => {
    return state.token
  }, [state.token])

  const updateAvatar = useCallback(async (avatarDataUrl: string) => {
    if (!state.user) return
    try {
      const res = await fetch('/api/data/avatar', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`,
        },
        body: JSON.stringify({ avatar: avatarDataUrl }),
      })
      if (!res.ok) throw new Error('Failed to update avatar')
      const updatedUser = { ...state.user, avatar: avatarDataUrl }
      saveAuth(updatedUser, state.token || '')
      setState(prev => ({
        ...prev,
        user: updatedUser,
      }))
      toast.success('头像已更新')
    } catch {
      toast.error('头像更新失败')
    }
  }, [state.user, state.token])

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, getToken, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
