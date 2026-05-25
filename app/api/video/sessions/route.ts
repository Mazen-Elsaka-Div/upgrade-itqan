import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { ADMIN_ROLES, type HalaqaPlatform } from '@/lib/halaqat'

/**
 * GET /api/video/sessions?platform=academy|maqraa
 *   &kind=halaqa|booking|course_session
 *   &active=1
 *   &limit=50
 *
 * Admin-only log of all video sessions on a platform with participant counts,
 * recording status, ratings, and a resolved title for the underlying entity.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const platform = url.searchParams.get('platform')
  if (platform !== 'academy' && platform !== 'maqraa') {
    return NextResponse.json({ error: 'platform مطلوب' }, { status: 400 })
  }
  const p = platform as HalaqaPlatform
  if (!ADMIN_ROLES[p].includes(session.role)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const kind = url.searchParams.get('kind')
  const active = url.searchParams.get('active') === '1'
  const limit = Math.min(Number(url.searchParams.get('limit') || '50') || 50, 200)

  const filters: string[] = ['vs.platform = $1']
  const args: unknown[] = [p]
  let i = 2
  if (kind && ['halaqa', 'booking', 'course_session'].includes(kind)) {
    filters.push(`vs.kind = $${i++}`)
    args.push(kind)
  }
  if (active) filters.push('vs.ended_at IS NULL')

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
    started_by_name: string | null
    title: string | null
    participants_count: number
    ratings_count: number
    avg_rating: number | null
  }>(
    `SELECT
       vs.id, vs.kind, vs.ref_id, vs.platform, vs.room_name, vs.started_at,
       vs.ended_at, vs.duration_seconds, vs.peak_participants, vs.total_participants,
       vs.recording_status, vs.recording_url,
       u.name AS started_by_name,
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
     LEFT JOIN users u ON u.id = vs.started_by
     WHERE ${filters.join(' AND ')}
     ORDER BY vs.started_at DESC
     LIMIT ${limit}`,
    args
  )

  return NextResponse.json({ data: rows })
}
