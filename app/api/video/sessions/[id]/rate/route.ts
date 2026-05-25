import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

/**
 * POST /api/video/sessions/[id]/rate
 * Body: { rating: 1-5, comment?, audio_quality?, video_quality?, teacher_rating? }
 *
 * Allowed for any user who actually joined the session.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const sessionRow = await queryOne<{ id: string; ended_at: string | null }>(
    `SELECT id, ended_at FROM video_sessions WHERE id = $1`,
    [id]
  )
  if (!sessionRow) return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 })

  const joined = await queryOne<{ id: string }>(
    `SELECT id FROM video_session_participants WHERE session_id = $1 AND user_id = $2 LIMIT 1`,
    [id, session.sub]
  )
  if (!joined) {
    return NextResponse.json(
      { error: 'يمكنك تقييم الجلسات التي حضرتها فقط' },
      { status: 403 }
    )
  }

  let body: {
    rating?: number
    comment?: string
    audio_quality?: number
    video_quality?: number
    teacher_rating?: number
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON غير صالح' }, { status: 400 })
  }

  const rating = Math.round(Number(body.rating))
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'التقييم يجب أن يكون بين 1 و 5' }, { status: 400 })
  }
  const clamp = (n: unknown) => {
    if (n === undefined || n === null) return null
    const v = Math.round(Number(n))
    if (Number.isNaN(v) || v < 1 || v > 5) return null
    return v
  }

  await query(
    `INSERT INTO video_session_ratings
       (session_id, user_id, rating, comment, audio_quality, video_quality, teacher_rating)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (session_id, user_id) DO UPDATE
       SET rating = EXCLUDED.rating,
           comment = EXCLUDED.comment,
           audio_quality = EXCLUDED.audio_quality,
           video_quality = EXCLUDED.video_quality,
           teacher_rating = EXCLUDED.teacher_rating,
           created_at = NOW()`,
    [
      id,
      session.sub,
      rating,
      body.comment ?? null,
      clamp(body.audio_quality),
      clamp(body.video_quality),
      clamp(body.teacher_rating),
    ]
  )
  return NextResponse.json({ success: true })
}

/** GET — return my rating for this session (or null). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const mine = await queryOne(
    `SELECT rating, comment, audio_quality, video_quality, teacher_rating, created_at
     FROM video_session_ratings WHERE session_id = $1 AND user_id = $2`,
    [id, session.sub]
  )
  return NextResponse.json({ data: mine })
}
