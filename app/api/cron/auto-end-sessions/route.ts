import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { endVideoSession } from '@/lib/video-sessions'
import { getVideoSettings } from '@/lib/video-settings'
import { listRoomParticipants } from '@/lib/livekit'

/**
 * Auto-end stale live sessions.
 *
 * Run on a cron (e.g. every 5 minutes). For each currently-live
 * video_session we:
 *   1. Force-end any session that ran past `max_duration_minutes`.
 *   2. Force-end any session with zero connected participants AND no
 *      participant activity for the last `inactivity_timeout_minutes`.
 *
 * Inactivity is detected by checking the LiveKit room itself (the
 * source of truth for *connected* participants right now); the
 * heuristic relies on the webhook closing `left_at` on participant
 * rows but also falls back to "no participants in LiveKit" so a
 * dropped webhook can never strand a session forever.
 */
export const dynamic = 'force-dynamic'

interface LiveSessionRow {
  id: string
  platform: 'academy' | 'maqraa'
  room_name: string
  started_at: string
  last_activity_at: string | null
}

export async function GET() {
  try {
    const live = await query<LiveSessionRow>(
      `SELECT
         vs.id,
         vs.platform,
         vs.room_name,
         vs.started_at,
         GREATEST(
           COALESCE((
             SELECT MAX(left_at) FROM video_session_participants WHERE session_id = vs.id
           ), vs.started_at),
           COALESCE((
             SELECT MAX(joined_at) FROM video_session_participants WHERE session_id = vs.id
           ), vs.started_at)
         ) AS last_activity_at
       FROM video_sessions vs
       WHERE vs.ended_at IS NULL`
    )

    let endedDuration = 0
    let endedInactivity = 0

    for (const row of live) {
      const settings = await getVideoSettings(row.platform)
      const now = Date.now()
      const startedAt = new Date(row.started_at).getTime()
      const lastActivityAt = row.last_activity_at
        ? new Date(row.last_activity_at).getTime()
        : startedAt

      // 1. Max duration breach
      if (settings.max_duration_minutes > 0) {
        const cap = settings.max_duration_minutes * 60_000
        if (now - startedAt >= cap) {
          await endVideoSession(row.id)
          endedDuration++
          continue
        }
      }

      // 2. Inactivity timeout — only end if LiveKit also says nobody is in
      //    the room. This protects against the webhook being dropped.
      if (settings.inactivity_timeout_minutes > 0) {
        const idle = settings.inactivity_timeout_minutes * 60_000
        if (now - lastActivityAt >= idle) {
          try {
            const participants = await listRoomParticipants(row.room_name)
            if (!participants || participants.length === 0) {
              await endVideoSession(row.id)
              endedInactivity++
            }
          } catch (err) {
            console.error('[cron/auto-end-sessions] LiveKit listRoom failed', err)
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      checked: live.length,
      ended_due_to_duration: endedDuration,
      ended_due_to_inactivity: endedInactivity,
    })
  } catch (err) {
    console.error('[cron/auto-end-sessions] error', err)
    return NextResponse.json({ ok: false, error: 'failed' }, { status: 500 })
  }
}
