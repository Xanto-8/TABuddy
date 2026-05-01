import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function getUserIdFromToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  try {
    const token = authHeader.slice(7)
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))
    if (!decoded.id || decoded.role !== 'admin') return null
    return decoded.id
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const adminId = getUserIdFromToken(request)
  if (!adminId) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: users })
  } catch (error) {
    console.error('[admin/users] GET error:', error)
    return NextResponse.json({ error: '获取用户列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const adminId = getUserIdFromToken(request)
  if (!adminId) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { userId, password, displayName, role } = body

    if (!userId) {
      return NextResponse.json({ error: '缺少用户ID' }, { status: 400 })
    }

    const updateData: Record<string, string> = {}

    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: '密码长度不能少于6位' }, { status: 400 })
      }
      updateData.password = password
    }

    if (displayName) {
      updateData.displayName = displayName
    }

    if (role && ['admin', 'ta'].includes(role)) {
      updateData.role = role
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '没有需要更新的字段' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
      },
    })

    return NextResponse.json({ data: user })
  } catch (error) {
    console.error('[admin/users] POST error:', error)
    return NextResponse.json({ error: '更新用户失败' }, { status: 500 })
  }
}
