import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { ADMIN_ROLES, type HalaqaPlatform } from '@/lib/halaqat'
import { getRoomService, isLiveKitConfigured } from '@/lib/livekit'

interface StatsPayload {
  // From DB
  total_sessions: number
  total_minutes: number
  total_unique_participants: number
  active_sessions: number
  sessions_last_7_days: number
  avg_duration_minutes: number
  avg_rating: number | null
  rated_sessions: number
  // From LiveKit (room service)
  live_rooms: number
  live_participants: number
  livekit_configured: boolean
  // By kind
  by_kind: Array<{ kind: string; count: number }>
}

/** GET /api/video/stats?platform=academy|maqraa */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const platform = new URL(req.url).searchParams.get('platform')
  if (platform !== 'academy' && platform !== 'maqraa') {
    return NextResponse.json({ error: 'platform مطلوب' }, { status: 400 })
  }
  const p = platform as HalaqaPlatform
  if (!ADMIN_ROLES[p].includes(session.role)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  // Aggregate DB metrics in parallel.
  const [aggRow, activeRow, byKindRows, ratingRow, weekRow] = await Promise.all([
    query<{
      total_sessions: number
      total_seconds: number
      total_unique_participants: number
      avg_seconds: number
    }>(
      `SELECT
         COUNT(*)::int AS total_sessions,
         COALESCE(SUM(duration_seconds), 0)::int AS total_seconds,
         (SELECT COUNT(DISTINCT user_id)::int FROM video_session_participants vsp
            JOIN video_sessions vs ON vs.id = vsp.session_id WHERE vs.platform = $1) AS total_unique_participants,
         COALESCE(AVG(duration_seconds), 0)::int AS avg_seconds
       FROM video_sessions WHERE platform = $1 AND ended_at IS NOT NULL`,
      [p]
    ),
    query<{ active_sessions: number }>(
      `SELECT COUNT(*)::int AS active_sessions FROM video_sessions WHERE platform = $1 AND ended_at IS NULL`,
      [p]
    ),
    query<{ kind: string; count: number }>(
      `SELECT kind, COUNT(*)::int AS count FROM video_sessions WHERE platform = $1 GROUP BY kind`,
      [p]
    ),
    query<{ avg_rating: number; rated: number }>(
      `SELECT AVG(r.rating)::numeric(3,2) AS avg_rating, COUNT(*)::int AS rated
       FROM video_session_ratings r
       JOIN video_sessions s ON s.id = r.session_id
       WHERE s.platform = $1`,
      [p]
    ),
    query<{ week: number }>(
      `SELECT COUNT(*)::int AS week FROM video_sessions
       WHERE platform = $1 AND started_at >= NOW() - INTERVAL '7 days'`,
      [p]
    ),
  ])

  // Query LiveKit for current live rooms (filter by name prefix isn't reliable
  // since we don't know which room belongs to which platform without a lookup —
  // we use video_sessions for that).
  let liveRooms = 0
  let liveParticipants = 0
  if (isLiveKitConfigured()) {
    try {
      const rs = getRoomService()
      const liveActiveRows = await query<{ room_name: string }>(
        `SELECT room_name FROM video_sessions WHERE platform = $1 AND ended_at IS NULL`,
        [p]
      )
      const names = liveActiveRows.map((r) => r.room_name)
      if (rs && names.length > 0) {
        const rooms = await rs.listRooms(names)
        liveRooms = rooms.length
        liveParticipants = rooms.reduce((acc, r) => acc + (r.numParticipants || 0), 0)
      }
    } catch (err) {
      console.error('[video/stats] livekit room list failed', err)
    }
  }

  const agg = aggRow[0] || { total_sessions: 0, total_seconds: 0, total_unique_participants: 0, avg_seconds: 0 }
  const active = activeRow[0]?.active_sessions || 0
  const rating = ratingRow[0] || { avg_rating: 0, rated: 0 }
  const week = weekRow[0]?.week || 0

  const payload: StatsPayload = {
    total_sessions: agg.total_sessions,
    total_minutes: Math.round((agg.total_seconds || 0) / 60),
    total_unique_participants: agg.total_unique_participants,
    active_sessions: active,
    sessions_last_7_days: week,
    avg_duration_minutes: Math.round((agg.avg_seconds || 0) / 60),
    avg_rating: rating.avg_rating ? Number(rating.avg_rating) : null,
    rated_sessions: rating.rated,
    live_rooms: liveRooms,
    live_participants: liveParticipants,
    livekit_configured: isLiveKitConfigured(),
    by_kind: byKindRows,
  }

  return NextResponse.json({ data: payload })
}
