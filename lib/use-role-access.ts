'use client'

import { useAuth } from './auth-store'

export type Role = 'superadmin' | 'classadmin' | 'student'

export function useRoleAccess() {
  const { user } = useAuth()
  const role = (user?.role || 'student') as Role
  const classGroupId = user?.classGroupId || null

  const isSuperAdmin = role === 'superadmin'
  const isClassAdmin = role === 'classadmin'
  const isStudent = role === 'student'
  const isAdminOrAbove = isSuperAdmin || isClassAdmin

  const roleLabel = isSuperAdmin ? '超级管理员'
    : isClassAdmin ? '班级管理员'
    : isStudent ? '学生'
    : '未知'

  const canManage = {
    globalKnowledge: isSuperAdmin,
    classKnowledge: isClassAdmin || isSuperAdmin,
    anyClass: isSuperAdmin,
    ownClass: isClassAdmin,
    users: isSuperAdmin,
    classes: isSuperAdmin,
    platformStats: isSuperAdmin,
    classStats: isClassAdmin || isSuperAdmin,
  }

  const canAccessRoute = (path: string): boolean => {
    if (path.startsWith('/admin')) {
      if (path.includes('/admin/classes')) return isSuperAdmin
      if (path.includes('/admin/users')) return isSuperAdmin
      if (path.includes('/admin/knowledge-base')) return isSuperAdmin
      return isAdminOrAbove
    }
    return true
  }

  return {
    role,
    classGroupId,
    isSuperAdmin,
    isClassAdmin,
    isStudent,
    isAdminOrAbove,
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
