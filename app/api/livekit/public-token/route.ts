import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import {
  courseSessionRoomName,
  isLiveKitConfigured,
  LIVEKIT_URL,
  mintLiveKitToken,
} from '@/lib/livekit'
import {
  findActiveSession,
  recordParticipantJoin,
} from '@/lib/video-sessions'
import { getVideoSettings } from '@/lib/video-settings'

/**
 * POST /api/livekit/public-token
 * Body: { token: string, name?: string }
 *
 * Allows unauthenticated guests to join a LiveKit room for a course_session
 * that has been published as `is_public = TRUE`. Only emits a `viewer`
 * (subscribe-only) token unless the session is currently live — guests cannot
 * publish audio/video by default.
 *
 * No persistent participant record is attached to a user_id because guests
 * aren't authenticated; we only bump the `total_participants` counter on the
 * underlying video_session if one is already running.
 */
export async function POST(req: NextRequest) {
  if (!isLiveKitConfigured()) {
    return NextResponse.json(
      { error: 'LiveKit is not configured on the server' },
      { status: 503 }
    )
  }

  let body: { token?: string; name?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const publicToken = (body.token || '').trim()
  if (!publicToken) {
    return NextResponse.json({ error: 'token مطلوب' }, { status: 400 })
  }
  const guestName = (body.name || '').trim().slice(0, 60) || 'ضيف'

  const row = await queryOne<{
    id: string
    title: string
    scheduled_at: string
    duration_minutes: number
    status: string
    course_id: string
  }>(
    `SELECT id, title, scheduled_at, duration_minutes, status, course_id
     FROM course_sessions
     WHERE public_join_token = $1 AND is_public = TRUE
     LIMIT 1`,
    [publicToken]
  )
  if (!row) {
    return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 })
  }

  // Allow joining a configurable window before scheduled start. We let it open
  // 15 minutes early so guests aren't locked out while the teacher prepares.
  const now = new Date()
  const start = new Date(row.scheduled_at)
  const end = new Date(start.getTime() + (row.duration_minutes || 60) * 60_000)
  const earlyJoinMs = 15 * 60_000
  const canJoin =
    row.status === 'in_progress' ||
    (start.getTime() - earlyJoinMs <= now.getTime() && now.getTime() <= end.getTime())
  if (!canJoin) {
    return NextResponse.json(
      { error: 'لا يمكن الانضمام إلى الجلسة في الوقت الحالي' },
      { status: 409 }
    )
  }

  const settings = await getVideoSettings('academy')
  const roomName = courseSessionRoomName(row.id)

  // Track participant counts on the live video_sessions row when present.
  let videoSessionId: string | null = null
  try {
    const active = await findActiveSession('course_session', row.id)
    if (active) {
      videoSessionId = active.id
      // Insert a lightweight guest-attendance bump. user_id is required on the
      // table, so we deliberately skip per-row inserts for guests and only
      // increment the totals counter.
      await query(
        `UPDATE video_sessions
         SET total_participants = total_participants + 1
         WHERE id = $1`,
        [active.id]
      )
    }
  } catch (err) {
    console.error('[livekit/public-token] failed to bump counter', err)
  }

  try {
    // Stable-ish anonymous identity scoped to this room. LiveKit will reject a
    // duplicate identity, so we add a short nonce.
    const nonce = Math.random().toString(36).slice(2, 8)
    const identity = `guest-${nonce}`
    const token = await mintLiveKitToken({
      roomName,
      identity,
      name: guestName,
      role: 'viewer',
      metadata: {
        role: 'guest',
        kind: 'course_session',
        refId: row.id,
        platform: 'academy',
        publicToken,
        videoSessionId,
      },
      ttlSeconds: 60 * 60 * 4,
    })

    return NextResponse.json({
      token,
      url: LIVEKIT_URL,
      roomName,
      role: 'viewer',
      identity,
      name: guestName,
      platform: 'academy',
      videoSessionId,
      sessionTitle: row.title,
      settings: {
        recording_enabled: settings.recording_enabled,
        allow_chat: settings.allow_chat,
        allow_screen_share: false,
        allow_student_unmute: false,
        allow_student_video: false,
        default_video_quality: settings.default_video_quality,
        default_audio_only: settings.default_audio_only,
        show_participant_count: settings.show_participant_count,
        watermark_text: settings.watermark_text,
        max_participants: settings.max_participants,
      },
    })
  } catch (err) {
    console.error('[livekit/public-token] error', err)
    return NextResponse.json({ error: 'فشل إنشاء رمز الدخول' }, { status: 500 })
  }
}
