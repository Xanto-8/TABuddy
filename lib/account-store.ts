'use client'

export interface SavedAccount {
  username: string
  password?: string
  isAdmin: boolean
  displayName: string
  subtitle: string
}

const ACCOUNTS_KEY = 'tabuddy_accounts'
const USERS_KEY = 'tabuddy_users'

export const ACCOUNT_PROFILES: Record<string, { displayName: string; subtitle: string }> = {
  tabuddy: { displayName: '助教老师', subtitle: '新东方国际教育' },
  admin: { displayName: '管理员', subtitle: '系统管理' },
}

export function getCurrentUsername(): string {
  if (typeof window === 'undefined') return ''
  try {
    const stored = localStorage.getItem('tabuddy_auth')
    if (!stored) return ''
    const parsed = JSON.parse(stored)
    return parsed.username || ''
  } catch {
    return ''
  }
}

export function getSavedAccounts(): SavedAccount[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(ACCOUNTS_KEY)
    let accounts: SavedAccount[]
    if (!stored) {
      accounts = getDefaultAccounts()
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
    } else {
      accounts = JSON.parse(stored)
    }

    const usersStored = localStorage.getItem(USERS_KEY)
    if (usersStored) {
      try {
        const registeredUsers = JSON.parse(usersStored)
        for (const ru of registeredUsers) {
          if (!accounts.find(a => a.username === ru.username)) {
            accounts.push({
              username: ru.username,
              password: ru.password,
              isAdmin: ru.isAdmin || false,
              displayName: ru.displayName || ru.username,
              subtitle: ru.org || '',
            })
          }
        }
      } catch {
      }
    }

    return accounts
  } catch {
    return getDefaultAccounts()
  }
}

export function saveAccount(account: SavedAccount): void {
  if (typeof window === 'undefined') return
  const accounts = getSavedAccounts()
  const idx = accounts.findIndex(a => a.username === account.username)
  if (idx >= 0) {
    accounts[idx] = account
  } else {
    accounts.push(account)
  }
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

export function removeAccount(username: string): void {
  if (typeof window === 'undefined') return
  const accounts = getSavedAccounts().filter(a => a.username !== username)
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
  removeUserDataBackup(username)
}

function getDefaultAccounts(): SavedAccount[] {
  return [
    { username: 'tabuddy', password: '123456', isAdmin: false, displayName: '助教老师', subtitle: '新东方国际教育' },
    { username: 'admin', password: '123456', isAdmin: true, displayName: '管理员', subtitle: '系统管理' },
  ]
}

const BACKUP_PREFIX = 'tabuddy_data_'

const EXCLUDED_KEYS = new Set([
  'tabuddy_auth',
  'tabuddy_accounts',
  'tabuddy_sidebar_open',
  'tabuddy_token',
  'tabuddy_users',
])

function getTabuddyKeys(): string[] {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('tabuddy_') && !EXCLUDED_KEYS.has(key) && !key.startsWith(BACKUP_PREFIX)) {
      keys.push(key)
    }
  }
  return keys
}

function removeUserDataBackup(username: string): void {
  if (typeof window === 'undefined') return
  const prefix = BACKUP_PREFIX + username + '_'
  const toRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(prefix)) {
      toRemove.push(key)
    }
  }
  toRemove.forEach(key => localStorage.removeItem(key))
}

export function backupCurrentUserData(username: string): void {
  if (typeof window === 'undefined') return
  const keys = getTabuddyKeys()
  keys.forEach(key => {
    const value = localStorage.getItem(key)
    if (value !== null) {
      localStorage.setItem(BACKUP_PREFIX + username + '_' + key, value)
    }
  })
}

export function restoreUserData(username: string): void {
  if (typeof window === 'undefined') return

  const prefix = BACKUP_PREFIX + username + '_'
  let hasBackup = false
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(prefix)) {
      hasBackup = true
      break
    }
  }

  if (!hasBackup) return

  const keys = getTabuddyKeys()
  keys.forEach(key => localStorage.removeItem(key))

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(prefix)) {
      const originalKey = key.slice(prefix.length)
      const value = localStorage.getItem(key)
      if (value !== null) {
        localStorage.setItem(originalKey, value)
      }
    }
  }
}

export function clearAllTabuddyData(): void {
  if (typeof window === 'undefined') return

  const keepKeys = new Set([
    'tabuddy_accounts',
    'tabuddy_sidebar_open',
    'tabuddy_users',
  ])

  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('tabuddy_') && !keepKeys.has(key) && !key.startsWith(BACKUP_PREFIX)) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key))
}

export function switchToAccount(currentUsername: string, targetUsername: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const accounts = getSavedAccounts()
      const target = accounts.find(a => a.username === targetUsername)
      if (!target) {
        reject(new Error('账号不存在'))
        return
      }

      if (currentUsername) {
        backupCurrentUserData(currentUsername)
      }

      clearAllTabuddyData()

      localStorage.setItem('tabuddy_auth', JSON.stringify({
        username: target.username,
        isAdmin: target.isAdmin,
      }))

      resolve()
    }, 300)
  })
}
