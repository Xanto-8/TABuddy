import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { errorResponse, successResponse, getBody } from '@/lib/api-data-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await getBody<{ code: string }>(request)
    if (!body || !body.code) {
      return errorResponse('请输入老师注册码')
    }

    const code = body.code.trim().toUpperCase()

    const validCode = await prisma.teacherRegCode.findFirst({
      where: { code, isActive: true },
    })

    if (!validCode) {
      return errorResponse('注册码无效或已失效', 400)
    }

    return successResponse({
      valid: true,
      message: '注册码验证通过',
    })
  } catch (error) {
    console.error('Verify teacher code error:', error)
    return errorResponse('验证失败', 500)
  }
}
