'use client'

import { useAuth } from './auth-store'

export type Role = 'superadmin' | 'classadmin' | 'assistant' | 'student'

export function useRoleAccess() {
  const { user } = useAuth()
  const role = (user?.role || 'student') as Role
  const classGroupId = user?.classGroupId || null

  const isSuperAdmin = role === 'superadmin'
  const isClassAdmin = role === 'classadmin'
  const isAssistant = role === 'assistant'
  const isStudent = role === 'student'
  const isAdminOrAbove = isSuperAdmin || isClassAdmin
  const canEditClasses = isClassAdmin || isSuperAdmin

  const roleLabel = isSuperAdmin ? '超级管理员'
    : isClassAdmin ? '班级管理员'
    : isAssistant ? '普通助教'
    : isStudent ? '学生'
    : '未知'

  const canManage = {
    globalKnowledge: isSuperAdmin || isClassAdmin,
    classKnowledge: canEditClasses,
    anyClass: isSuperAdmin,
    ownClass: isClassAdmin,
    users: isSuperAdmin,
    classes: isSuperAdmin,
    platformStats: isSuperAdmin,
    classStats: canEditClasses,
    inviteCode: isClassAdmin,
    assistantManagement: isClassAdmin,
  }

  const canAccessRoute = (path: string): boolean => {
    if (path.startsWith('/admin')) {
      if (path.includes('/admin/classes')) return isSuperAdmin
      if (path.includes('/admin/users')) return isSuperAdmin
      if (path.includes('/admin/knowledge-base')) return isSuperAdmin || isClassAdmin
      return isAdminOrAbove
    }
    if (path === '/assistant-management') return isClassAdmin
    return true
  }

  return {
    role,
    classGroupId,
    isSuperAdmin,
    isClassAdmin,
    isAssistant,
    isStudent,
    isAdminOrAbove,
    canEditClasses,
    roleLabel,
    canManage,
    canAccessRoute,
  }
}

export function useRequireRole(allowedRoles: Role[]) {
  const { isAuthenticated } = useAuth()
  const { role } = useRoleAccess()
  return isAuthenticated && allowedRoles.includes(role)
}
