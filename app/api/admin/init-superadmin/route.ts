import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { errorResponse, successResponse } from '@/lib/api-data-utils'

export async function POST(request: NextRequest) {
  try {
    const initPassword = process.env.INIT_SUPERADMIN_PASSWORD
    if (!initPassword) {
      return errorResponse('环境变量 INIT_SUPERADMIN_PASSWORD 未配置', 403)
    }

    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: 'superadmin' },
    })

    if (existingSuperAdmin) {
      return errorResponse('超级管理员已存在，无需初始化', 400)
    }

    const user = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {
        password: initPassword,
        displayName: '超级管理员',
        role: 'superadmin',
      },
      create: {
        username: 'admin',
        password: initPassword,
        displayName: '超级管理员',
        role: 'superadmin',
      },
    })

    return successResponse({
      message: '超级管理员初始化成功',
      username: user.username,
    })
  } catch (error) {
    console.error('[admin/init-superadmin] error:', error)
    return errorResponse('初始化失败', 500)
  }
}
