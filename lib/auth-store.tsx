'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { toast } from 'sonner'

export interface AuthUser {
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
  updateAvatar: (avatarDataUrl: string) => void
}

const FIXED_USERNAME = 'tabuddy'
const FIXED_PASSWORD = '123456'
const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = '123456'

const AUTH_KEY = 'tabuddy_auth'
const TOKEN_KEY = 'tabuddy_token'
const USERS_KEY = 'tabuddy_users'
const ACCOUNTS_KEY = 'tabuddy_accounts'

const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

interface StoredUser {
  username: string
  password: string
  isAdmin: boolean
  displayName?: string
  role?: string
  org?: string
  avatar?: string
}

function generateToken(username: string): string {
  const payload = { username, iat: Date.now(), exp: Date.now() + TOKEN_EXPIRY_MS }
  return btoa(JSON.stringify(payload))
}

function decodeToken(token: string): { username: string; iat: number; exp: number } | null {
  try {
    return JSON.parse(atob(token))
  } catch {
    return null
  }
}

function isTokenValid(token: string | null): boolean {
  if (!token) return false
  const decoded = decodeToken(token)
  if (!decoded) return false
  return decoded.exp > Date.now()
}

function getRegisteredUsers(): StoredUser[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(USERS_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch {
    return []
  }
}

function saveRegisteredUser(user: StoredUser): void {
  if (typeof window === 'undefined') return
  const users = getRegisteredUsers()
  users.push(user)
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function syncAccountProfile(user: StoredUser): void {
  if (typeof window === 'undefined') return
  try {
    const stored = localStorage.getItem(ACCOUNTS_KEY)
    if (!stored) return
    const accounts = JSON.parse(stored)
    const idx = accounts.findIndex((a: any) => a.username === user.username)
    const profile = {
      username: user.username,
      password: user.password,
      isAdmin: user.isAdmin,
      displayName: user.displayName || user.username,
      subtitle: user.org || '',
    }
    if (idx >= 0) {
      accounts[idx] = { ...accounts[idx], ...profile }
    } else {
      accounts.push(profile)
    }
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
  } catch {
  }
}

function getAuthFromStorage(): AuthState {
  if (typeof window === 'undefined') {
    return { user: null, isAuthenticated: false, token: null }
  }
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token || !isTokenValid(token)) {
      clearAuth()
      return { user: null, isAuthenticated: false, token: null }
    }

    const stored = localStorage.getItem(AUTH_KEY)
    if (!stored) {
      clearAuth()
      return { user: null, isAuthenticated: false, token: null }
    }

    const parsed = JSON.parse(stored)
    if (parsed && parsed.username) {
      const decoded = decodeToken(token)
      if (!decoded || decoded.username !== parsed.username) {
        clearAuth()
        return { user: null, isAuthenticated: false, token: null }
      }
      return {
        user: {
          username: parsed.username,
          isAdmin: parsed.isAdmin === true,
          displayName: parsed.displayName,
          role: parsed.role,
          org: parsed.org,
          avatar: parsed.avatar,
        },
        isAuthenticated: true,
        token,
      }
    }
    return { user: null, isAuthenticated: false, token: null }
  } catch {
    clearAuth()
    return { user: null, isAuthenticated: false, token: null }
  }
}

function saveAuth(user: { username: string; isAdmin: boolean; displayName?: string; role?: string; org?: string; avatar?: string }, token: string): void {
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
    const restored = getAuthFromStorage()
    setState(restored)
  }, [])

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 800))

    if (!username || !password) {
      toast.error('请输入用户名和密码')
      return false
    }

    let matchedUser: StoredUser | null = null

    if (username === FIXED_USERNAME) {
      if (password !== FIXED_PASSWORD) {
        toast.error('密码错误')
        return false
      }
      matchedUser = { username: FIXED_USERNAME, password: FIXED_PASSWORD, isAdmin: false, displayName: '助教老师', role: '助教', org: '新东方国际教育' }
    } else if (username === ADMIN_USERNAME) {
      if (password !== ADMIN_PASSWORD) {
        toast.error('密码错误')
        return false
      }
      matchedUser = { username: ADMIN_USERNAME, password: ADMIN_PASSWORD, isAdmin: true, displayName: '管理员', role: '管理员', org: '系统管理' }
    } else {
      const registeredUsers = getRegisteredUsers()
      const found = registeredUsers.find(u => u.username === username)
      if (!found) {
        toast.error('账号不存在')
        return false
      }
      if (found.password !== password) {
        toast.error('密码错误')
        return false
      }
      matchedUser = found
    }

    const token = generateToken(username)
    const userProfile = {
      username: matchedUser.username,
      isAdmin: matchedUser.isAdmin,
      displayName: matchedUser.displayName || matchedUser.username,
      role: matchedUser.role || (matchedUser.isAdmin ? '管理员' : '助教'),
      org: matchedUser.org || '',
      avatar: matchedUser.avatar || '',
    }

    saveAuth(userProfile, token)

    try {
      const { restoreUserData } = await import('@/lib/account-store')
      restoreUserData(username)
    } catch {
    }

    setState({
      user: { ...userProfile },
      isAuthenticated: true,
      token,
    })

    toast.success('登录成功，欢迎回来！')
    return true
  }, [])

  const register = useCallback(async (username: string, password: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 800))

    if (!username || !password) {
      throw new Error('请填写所有注册信息')
    }

    if (password.length < 6) {
      throw new Error('密码长度至少为6位')
    }

    if (username === FIXED_USERNAME || username === ADMIN_USERNAME) {
      throw new Error('该用户名已被注册')
    }

    const registeredUsers = getRegisteredUsers()
    if (registeredUsers.some(u => u.username === username)) {
      throw new Error('该用户名已被注册')
    }

    const newUser: StoredUser = {
      username,
      password,
      isAdmin: false,
      displayName: username,
      role: '助教',
      org: '',
    }

    saveRegisteredUser(newUser)
    syncAccountProfile(newUser)
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    setState({ user: null, isAuthenticated: false, token: null })
    toast.info('已退出登录')
  }, [])

  const getToken = useCallback((): string | null => {
    return state.token
  }, [state.token])

  const updateAvatar = useCallback((avatarDataUrl: string) => {
    if (!state.user) return
    const updatedUser = { ...state.user, avatar: avatarDataUrl }
    saveAuth(updatedUser, state.token || '')
    setState(prev => ({
      ...prev,
      user: updatedUser,
    }))
    toast.success('头像已更新')
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
