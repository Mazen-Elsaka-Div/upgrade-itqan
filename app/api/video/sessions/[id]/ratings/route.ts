import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

/**
 * GET /api/video/sessions/[id]/ratings
 *
 * Returns the individual student ratings for a session so the host (teacher /
 * reader / admin) can monitor feedback. Only the user who started the session
 * (or an admin) may read the detailed list and comments.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const sessionRow = await queryOne<{ id: string; started_by: string | null }>(
    `SELECT id, started_by FROM video_sessions WHERE id = $1`,
    [id]
  )
  if (!sessionRow) return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 })

  const isHost = sessionRow.started_by === session.sub
  const isAdmin = session.role === 'admin' || session.role === 'academy_admin'
  if (!isHost && !isAdmin) {
    return NextResponse.json(
      { error: 'يمكنك الاطلاع على تقييمات جلساتك فقط' },
      { status: 403 }
    )
  }

  const rows = await query<{
    rating: number
    comment: string | null
    audio_quality: number | null
    video_quality: number | null
    teacher_rating: number | null
    created_at: string
    student_name: string | null
  }>(
    `SELECT r.rating, r.comment, r.audio_quality, r.video_quality,
            r.teacher_rating, r.created_at,
            u.name AS student_name
     FROM video_session_ratings r
     LEFT JOIN users u ON u.id = r.user_id
     WHERE r.session_id = $1
     ORDER BY r.created_at DESC`,
    [id]
  )

  const summary = await queryOne<{
    count: number
    avg_rating: number | null
    avg_audio: number | null
    avg_video: number | null
    avg_teacher: number | null
  }>(
    `SELECT
       COUNT(*)::int AS count,
       AVG(rating)::numeric(3,2) AS avg_rating,
       AVG(audio_quality)::numeric(3,2) AS avg_audio,
       AVG(video_quality)::numeric(3,2) AS avg_video,
       AVG(teacher_rating)::numeric(3,2) AS avg_teacher
     FROM video_session_ratings
     WHERE session_id = $1`,
    [id]
  )

  return NextResponse.json({ data: rows, summary })
}
