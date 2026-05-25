import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

/**
 * GET /api/video/my-sessions
 *   ?role=host|attendee|any  (default: any)
 *   ?limit=50                 (max 200)
 *   ?cursor=<iso>             (cursor: started_at < this value)
 *   ?kind=halaqa|booking|course_session
 *   ?platform=academy|maqraa
 *
 * Returns the calling user's video session history with participant /
 * rating roll-ups. Works for hosts (teachers, readers, admins) as well as
 * regular attendees so the same endpoint backs both "my classes" for the
 * teacher portal and "my attended sessions" for students/parents.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const role = (url.searchParams.get('role') || 'any').toLowerCase()
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || '50'), 1), 200)
  const cursor = url.searchParams.get('cursor')
  const kind = url.searchParams.get('kind')
  const platform = url.searchParams.get('platform')

  const filters: string[] = []
  const args: unknown[] = []
  let i = 1

  // Membership filter
  if (role === 'host') {
    filters.push(`vs.started_by = $${i++}`)
    args.push(session.sub)
  } else if (role === 'attendee') {
    filters.push(`EXISTS (
      SELECT 1 FROM video_session_participants p
      WHERE p.session_id = vs.id AND p.user_id = $${i++}
    )`)
    args.push(session.sub)
  } else {
    filters.push(`(vs.started_by = $${i} OR EXISTS (
      SELECT 1 FROM video_session_participants p
      WHERE p.session_id = vs.id AND p.user_id = $${i}
    ))`)
    args.push(session.sub)
    i++
  }

  if (kind && ['halaqa', 'booking', 'course_session'].includes(kind)) {
    filters.push(`vs.kind = $${i++}`)
    args.push(kind)
  }
  if (platform && ['academy', 'maqraa'].includes(platform)) {
    filters.push(`vs.platform = $${i++}`)
    args.push(platform)
  }
  if (cursor) {
    filters.push(`vs.started_at < $${i++}`)
    args.push(cursor)
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : ''

  const rows = await query<{
    id: string
    kind: string
    ref_id: string
    platform: string
    room_name: string
    started_at: string
    ended_at: string | null
    duration_seconds: number | null
    peak_participants: number
    total_participants: number
    recording_status: string
    recording_url: string | null
    started_by: string | null
    is_host: boolean
    is_attendee: boolean
    title: string | null
    participants_count: number
    ratings_count: number
    avg_rating: number | null
  }>(
    `SELECT
       vs.id, vs.kind, vs.ref_id, vs.platform, vs.room_name,
       vs.started_at, vs.ended_at, vs.duration_seconds,
       vs.peak_participants, vs.total_participants,
       vs.recording_status, vs.recording_url,
       vs.started_by,
       (vs.started_by = $1) AS is_host,
       EXISTS (
         SELECT 1 FROM video_session_participants p
         WHERE p.session_id = vs.id AND p.user_id = $1
       ) AS is_attendee,
       COALESCE(
         CASE vs.kind
           WHEN 'halaqa' THEN (SELECT h.name FROM halaqat h WHERE h.id = vs.ref_id)
           WHEN 'booking' THEN (SELECT CONCAT('جلسة 1:1 - ', COALESCE(s.name, '')) FROM bookings b
                                 LEFT JOIN users s ON s.id = b.student_id WHERE b.id = vs.ref_id)
           WHEN 'course_session' THEN (SELECT cs.title FROM course_sessions cs WHERE cs.id = vs.ref_id)
         END,
         vs.kind
       ) AS title,
       (SELECT COUNT(*)::int FROM video_session_participants WHERE session_id = vs.id) AS participants_count,
       (SELECT COUNT(*)::int FROM video_session_ratings WHERE session_id = vs.id) AS ratings_count,
       (SELECT AVG(rating)::numeric(3,2) FROM video_session_ratings WHERE session_id = vs.id) AS avg_rating
     FROM video_sessions vs
     ${where}
     ORDER BY vs.started_at DESC
     LIMIT ${limit}`,
    args
  )

  const nextCursor = rows.length === limit ? rows[rows.length - 1].started_at : null
  return NextResponse.json({ data: rows, nextCursor })
}
