import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

/**
 * GET /api/video/recordings
 *   ?kind=halaqa|booking|course_session
 *   ?platform=academy|maqraa
 *   ?scope=mine|admin
 *   ?q=<search>
 *   ?limit=50 (max 200)
 *
 * Returns video_sessions that produced a recording (egress *or* client-side
 * multipart) the caller is entitled to see.
 *
 * Scope rules:
 *   - admin: requires admin role for the requested platform; returns all
 *            recordings on that platform.
 *   - mine:  returns sessions the caller hosted or attended.
 *   - (default): falls back to "mine" so we never leak across users.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const kind = url.searchParams.get('kind')
  const platform = url.searchParams.get('platform')
  const scope = (url.searchParams.get('scope') || 'mine').toLowerCase()
  const q = (url.searchParams.get('q') || '').trim().toLowerCase()
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || '50'), 1), 200)

  const ADMIN_BY_PLATFORM: Record<string, string[]> = {
    academy: ['admin', 'academy_admin'],
    maqraa: ['admin', 'reciter_supervisor'],
  }
  const userId = session.sub

  const filters: string[] = []
  const args: unknown[] = []
  let i = 1

  // Only sessions that actually produced something playable.
  filters.push(
    `(vs.recording_url IS NOT NULL OR EXISTS (
       SELECT 1 FROM video_recordings r
       WHERE r.session_id = vs.id AND r.status = 'completed' AND r.recording_url IS NOT NULL
     ))`
  )

  if (kind && ['halaqa', 'booking', 'course_session'].includes(kind)) {
    filters.push(`vs.kind = $${i++}`)
    args.push(kind)
  }
  if (platform && ['academy', 'maqraa'].includes(platform)) {
    filters.push(`vs.platform = $${i++}`)
    args.push(platform)
  }

  if (scope === 'admin') {
    const allowedAdminPlatforms = Object.entries(ADMIN_BY_PLATFORM)
      .filter(([, roles]) => roles.includes(session.role))
      .map(([p]) => p)
    if (allowedAdminPlatforms.length === 0) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }
    if (!platform) {
      filters.push(`vs.platform = ANY($${i++}::text[])`)
      args.push(allowedAdminPlatforms)
    }
  } else {
    // Default: only sessions the user is connected to.
    filters.push(`(vs.started_by = $${i} OR EXISTS (
      SELECT 1 FROM video_session_participants p
      WHERE p.session_id = vs.id AND p.user_id = $${i}
    ))`)
    args.push(userId)
    i++
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : ''

  const rows = await query<{
    id: string
    kind: string
    ref_id: string
    platform: string
    title: string | null
    started_at: string
    ended_at: string | null
    duration_seconds: number | null
    recording_url: string | null
    started_by: string | null
    started_by_name: string | null
    participants_count: number
  }>(
    `SELECT
       vs.id, vs.kind, vs.ref_id, vs.platform, vs.started_at, vs.ended_at,
       vs.duration_seconds,
       COALESCE(
         (SELECT recording_url FROM video_recordings WHERE session_id = vs.id AND status = 'completed' AND recording_url IS NOT NULL ORDER BY completed_at DESC NULLS LAST LIMIT 1),
         vs.recording_url
       ) AS recording_url,
       vs.started_by,
       u.name AS started_by_name,
       (SELECT COUNT(*)::int FROM video_session_participants WHERE session_id = vs.id) AS participants_count,
       COALESCE(
         CASE vs.kind
           WHEN 'halaqa' THEN (SELECT h.name FROM halaqat h WHERE h.id = vs.ref_id)
           WHEN 'booking' THEN (SELECT CONCAT('جلسة 1:1 - ', COALESCE(s.name, '')) FROM bookings b
                                LEFT JOIN users s ON s.id = b.student_id WHERE b.id = vs.ref_id)
           WHEN 'course_session' THEN (SELECT cs.title FROM course_sessions cs WHERE cs.id = vs.ref_id)
         END,
         vs.kind
       ) AS title
     FROM video_sessions vs
     LEFT JOIN users u ON u.id = vs.started_by
     ${where}
     ORDER BY vs.started_at DESC
     LIMIT ${limit}`,
    args
  )

  const filtered = q
    ? rows.filter(
        (r) =>
          (r.title || '').toLowerCase().includes(q) ||
          (r.started_by_name || '').toLowerCase().includes(q)
      )
    : rows

  return NextResponse.json({ data: filtered })
}
