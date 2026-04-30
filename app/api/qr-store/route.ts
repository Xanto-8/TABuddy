import { NextRequest, NextResponse } from 'next/server'

interface SessionPhoto {
  filePath: string
  fileName: string
  uploadedAt: number
}

interface Session {
  id: string
  createdAt: number
  expiresAt: number
  photos: SessionPhoto[]
}

const SESSION_TTL = 5 * 60 * 1000
const CLEANUP_INTERVAL = 60 * 1000

const sessions = new Map<string, Session>()
let lastCleanup = Date.now()

function cleanupExpiredSessions() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [id, session] of Array.from(sessions.entries())) {
    if (now > session.expiresAt) {
      sessions.delete(id)
    }
  }
}

function generateSessionId(): string {
  const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 10)
  return id
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const body = await request.json()
      const { action, session, filePath, fileName } = body

      if (action === 'create') {
        cleanupExpiredSessions()
        const now = Date.now()
        const newSession: Session = {
          id: generateSessionId(),
          createdAt: now,
          expiresAt: now + SESSION_TTL,
          photos: [],
        }
        sessions.set(newSession.id, newSession)
        return NextResponse.json({
          success: true,
          sessionId: newSession.id,
          expiresAt: newSession.expiresAt,
        })
      }

      if (!session || !filePath) {
        return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
      }

      const existing = sessions.get(session)
      if (!existing) {
        return NextResponse.json({ error: '会话不存在或已过期，请刷新二维码' }, { status: 410 })
      }
      if (Date.now() > existing.expiresAt) {
        sessions.delete(session)
        return NextResponse.json({ error: '会话已过期，请刷新二维码' }, { status: 410 })
      }

      existing.photos.push({ filePath, fileName, uploadedAt: Date.now() })
      return NextResponse.json({ success: true, count: existing.photos.length })
    }

    return NextResponse.json({ error: '不支持的请求格式' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: '处理失败' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  cleanupExpiredSessions()

  const { searchParams } = new URL(request.url)
  const session = searchParams.get('session')
  const since = parseInt(searchParams.get('since') || '0', 10)

  if (!session) {
    return NextResponse.json({ error: '缺少 session 参数' }, { status: 400 })
  }

  const existing = sessions.get(session)
  if (!existing) {
    return NextResponse.json({
      success: false,
      expired: true,
      error: '会话不存在或已过期',
      photos: [],
      allCount: 0,
      expiresAt: 0,
    })
  }

  const now = Date.now()
  if (now > existing.expiresAt) {
    sessions.delete(session)
    return NextResponse.json({
      success: false,
      expired: true,
      error: '会话已过期',
      photos: [],
      allCount: 0,
      expiresAt: 0,
    })
  }

  const newPhotos = existing.photos.filter((p) => p.uploadedAt > since)
  const remainingMs = existing.expiresAt - now

  return NextResponse.json({
    success: true,
    expired: false,
    photos: newPhotos,
    allCount: existing.photos.length,
    expiresAt: existing.expiresAt,
    remainingMs,
  })
}
