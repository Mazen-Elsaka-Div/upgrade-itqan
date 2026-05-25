import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { ADMIN_ROLES, type HalaqaPlatform } from '@/lib/halaqat'

/**
 * GET /api/video/sessions/[id]
 *
 * Allowed for:
 *   - platform admins (academy_admin / admin / reciter_supervisor),
 *   - the host that started the session,
 *   - participants who actually joined.
 *
 * Non-admin callers still get participant + rating roll-ups so the teacher
 * portal can render aggregated ratings, but per-user feedback comments are
 * anonymised for non-admins.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const row = await queryOne<{
    id: string
    kind: string
    ref_id: string
    platform: HalaqaPlatform
    room_name: string
    started_at: string
    ended_at: string | null
    duration_seconds: number | null
    peak_participants: number
    total_participants: number
    recording_status: string
    recording_url: string | null
    notes: string | null
    started_by: string | null
  }>(`SELECT * FROM video_sessions WHERE id = $1`, [id])

  if (!row) return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 })

  const isAdmin = ADMIN_ROLES[row.platform].includes(session.role)
  const isHost = row.started_by === session.sub
  let isAttendee = false
  if (!isAdmin && !isHost) {
    const att = await queryOne<{ id: string }>(
      `SELECT id FROM video_session_participants WHERE session_id = $1 AND user_id = $2 LIMIT 1`,
      [id, session.sub]
    )
    isAttendee = !!att
  }
  if (!isAdmin && !isHost && !isAttendee) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const [participants, ratings] = await Promise.all([
    query<{
      user_id: string
      name: string
      email: string
      role: string
      joined_at: string
      left_at: string | null
      duration_seconds: number | null
    }>(
      `SELECT p.user_id, u.name, u.email, p.role, p.joined_at, p.left_at, p.duration_seconds
       FROM video_session_participants p
       JOIN users u ON u.id = p.user_id
       WHERE p.session_id = $1
       ORDER BY p.joined_at ASC`,
      [id]
    ),
    query<{
      id: string
      user_id: string
      name: string
      rating: number
      comment: string | null
      audio_quality: number | null
      video_quality: number | null
      teacher_rating: number | null
      created_at: string
    }>(
      `SELECT r.id, r.user_id, u.name, r.rating, r.comment, r.audio_quality,
              r.video_quality, r.teacher_rating, r.created_at
       FROM video_session_ratings r
       JOIN users u ON u.id = r.user_id
       WHERE r.session_id = $1
       ORDER BY r.created_at DESC`,
      [id]
    ),
  ])

  let titleInfo: { title: string | null } = { title: null }
  if (row.kind === 'halaqa') {
    titleInfo = await queryOne<{ title: string | null }>(
      `SELECT name AS title FROM halaqat WHERE id = $1`,
      [row.ref_id]
    ) || { title: null }
  } else if (row.kind === 'booking') {
    titleInfo = await queryOne<{ title: string | null }>(
      `SELECT CONCAT('جلسة مع ', COALESCE(s.name, '')) AS title FROM bookings b
       LEFT JOIN users s ON s.id = b.student_id WHERE b.id = $1`,
      [row.ref_id]
    ) || { title: null }
  } else if (row.kind === 'course_session') {
    titleInfo = await queryOne<{ title: string | null }>(
      `SELECT title FROM course_sessions WHERE id = $1`,
      [row.ref_id]
    ) || { title: null }
  }

  // Non-admins (hosts + attendees) don't get raw email addresses or other
  // users' comments. Hosts still see ratings + counts they're entitled to.
  const safeParticipants = isAdmin
    ? participants
    : participants.map((p) => ({ ...p, email: '' }))
  const safeRatings = isAdmin || isHost
    ? ratings
    : ratings.map((r) =>
        r.user_id === session.sub
          ? r
          : { ...r, user_id: '', name: '', comment: null }
      )

  return NextResponse.json({
    data: { ...row, title: titleInfo.title, viewer_role: isAdmin ? 'admin' : isHost ? 'host' : 'attendee' },
    participants: safeParticipants,
    ratings: safeRatings,
  })
}
