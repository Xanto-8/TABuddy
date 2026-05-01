import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse } from '@/lib/auth-guard'

export async function POST(request: NextRequest) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { oldPassword, newPassword } = body

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: '请提供当前密码和新密码' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: '新密码至少6位' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: tokenUser.userId },
      select: { password: true },
    })

    if (!user) return unauthorizedResponse()

    if (user.password !== oldPassword) {
      return NextResponse.json({ error: '当前密码错误' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: tokenUser.userId },
      data: { password: newPassword },
    })

    return NextResponse.json({ data: { message: '密码修改成功' } })
  } catch (error) {
    console.error('[change-password] error:', error)
    return NextResponse.json({ error: '修改密码失败' }, { status: 500 })
  }
}
