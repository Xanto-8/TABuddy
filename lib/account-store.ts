import { getCache, isCacheLoaded } from './store'

export interface SavedAccount {
  username: string
  displayName?: string
  isAdmin?: boolean
  subtitle?: string
}

export const ACCOUNT_PROFILES: Record<string, { displayName: string; subtitle: string }> = {
  tabuddy: { displayName: 'Tabuddy', subtitle: '默认管理员' },
  admin: { displayName: 'Admin', subtitle: '系统管理员' },
}

export function getSavedAccounts(): SavedAccount[] {
  if (typeof window === 'undefined') return []
  try {
    const accounts = localStorage.getItem('tabuddy_saved_accounts')
    return accounts ? JSON.parse(accounts) : []
  } catch { return [] }
}

export function saveAccount(acct: SavedAccount): void {
  if (typeof window === 'undefined') return
  try {
    const accounts = getSavedAccounts()
    const existing = accounts.findIndex(a => a.username === acct.username)
    if (existing >= 0) {
      accounts[existing] = acct
    } else {
      accounts.push(acct)
    }
    localStorage.setItem('tabuddy_saved_accounts', JSON.stringify(accounts))
  } catch { }
}

export function removeAccount(username: string): void {
  if (typeof window === 'undefined') return
  try {
    const accounts = getSavedAccounts().filter(a => a.username !== username)
    localStorage.setItem('tabuddy_saved_accounts', JSON.stringify(accounts))
  } catch { }
}

export function getStoredPassword(username: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    const passwords = localStorage.getItem('tabuddy_saved_passwords')
    if (!passwords) return null
    const map = JSON.parse(passwords)
    return map[username] || null
  } catch { return null }
}

export function savePassword(username: string, password: string): void {
  if (typeof window === 'undefined') return
  try {
    const passwords = localStorage.getItem('tabuddy_saved_passwords')
    const map = passwords ? JSON.parse(passwords) : {}
    map[username] = password
    localStorage.setItem('tabuddy_saved_passwords', JSON.stringify(map))
  } catch { }
}

export function removePassword(username: string): void {
  if (typeof window === 'undefined') return
  try {
    const passwords = localStorage.getItem('tabuddy_saved_passwords')
    if (!passwords) return
    const map = JSON.parse(passwords)
    delete map[username]
    localStorage.setItem('tabuddy_saved_passwords', JSON.stringify(map))
  } catch { }
}

export function isCacheReady(): boolean {
  return isCacheLoaded()
}

export function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('tabuddy_auth')
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.id || null
    }
    return null
  } catch { return null }
}
