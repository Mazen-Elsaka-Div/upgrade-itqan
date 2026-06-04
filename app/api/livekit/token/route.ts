import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import {
  halaqaRoomName,
  bookingRoomName,
  courseSessionRoomName,
  ensureRoom,
  mintLiveKitToken,
  isLiveKitConfigured,
  LIVEKIT_URL,
  type LiveKitRole,
} from '@/lib/livekit'
import {
  findActiveSession,
  recordParticipantJoin,
  startVideoSession,
  type VideoSessionKind,
} from '@/lib/video-sessions'
import { getVideoSettings } from '@/lib/video-settings'
import type { HalaqaPlatform } from '@/lib/halaqat'

/**
 * POST /api/livekit/token
 * Body: { kind: 'halaqa' | 'booking' | 'session', id: string }
 *
 * Returns: { token, url, roomName, role, identity, settings, videoSessionId }
 *
 * Authorization rules:
 *   - halaqa:  teacher_id (host), enrolled student / admin (participant)
 *   - booking: reader (host), student of that booking (participant)
 *   - session: course teacher (host), enrolled student (participant)
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isLiveKitConfigured()) {
    return NextResponse.json(
      { error: 'LiveKit is not configured on the server' },
      { status: 503 }
    )
  }

  let body: { kind?: string; id?: string; stealth?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const rawKind = body.kind || ''
  const kind: VideoSessionKind | null =
    rawKind === 'session' ? 'course_session'
      : rawKind === 'halaqa' ? 'halaqa'
      : rawKind === 'booking' ? 'booking'
      : rawKind === 'course_session' ? 'course_session'
      : null
  const refId = body.id
  if (!kind || !refId) {
    return NextResponse.json({ error: 'kind و id مطلوبان' }, { status: 400 })
  }

  const userId = session.sub
  const userRole = session.role
  const userName = session.name || session.email

  let roomName = ''
  let livekitRole: LiveKitRole = 'participant'
  let platform: HalaqaPlatform = 'academy'

  if (kind === 'halaqa') {
    const rows = await query<{
      id: string
      teacher_id: string | null
      livekit_room_name: string | null
      is_active: boolean
      platform: HalaqaPlatform
    }>(
      `SELECT id, teacher_id, livekit_room_name, is_active, platform FROM halaqat WHERE id = $1`,
      [refId]
    )
    if (rows.length === 0) {
      return NextResponse.json({ error: 'الحلقة غير موجودة' }, { status: 404 })
    }
    const halaqa = rows[0]
    platform = halaqa.platform || 'academy'

    const adminRoles = ['admin', 'academy_admin', 'reciter_supervisor']
    const isOwner = halaqa.teacher_id === userId
    const isAdmin = adminRoles.includes(userRole)
    const isHost = ['teacher', 'reader'].includes(userRole)

    if (body.stealth && isAdmin) {
      livekitRole = 'stealth'
    } else if (isOwner || isAdmin || isHost) {
      livekitRole = 'host'
    } else {
      const enr = await query<{ id: string }>(
        `SELECT id FROM halaqat_students
         WHERE halaqah_id = $1 AND student_id = $2 AND is_active = TRUE`,
        [refId, userId]
      )
      if (enr.length === 0) {
        return NextResponse.json(
          { error: 'لست مسجلاً في هذه الحلقة' },
          { status: 403 }
        )
      }
      livekitRole = 'participant'
    }

    roomName = halaqa.livekit_room_name || halaqaRoomName(halaqa.id)
  } else if (kind === 'booking') {
    const rows = await query<{
      id: string
      reader_id: string
      student_id: string
      status: string
    }>(`SELECT id, reader_id, student_id, status FROM bookings WHERE id = $1`, [refId])
    if (rows.length === 0) {
      return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 })
    }
    const booking = rows[0]
    const isReader = booking.reader_id === userId
    const isStudent = booking.student_id === userId
    if (!isReader && !isStudent && !['admin', 'reciter_supervisor', 'student_supervisor'].includes(userRole)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }
    if (!['confirmed', 'pending', 'rescheduled'].includes(booking.status)) {
      return NextResponse.json(
        { error: 'لا يمكن الدخول إلى هذه الجلسة في حالتها الحالية' },
        { status: 400 }
      )
    }
    if (body.stealth && ['admin', 'reciter_supervisor', 'student_supervisor'].includes(userRole)) {
      livekitRole = 'stealth'
    } else {
      livekitRole = isReader ? 'host' : 'participant'
    }
    platform = 'maqraa'
    roomName = bookingRoomName(booking.id)
  } else {
    // course_session
    const rows = await query<{
      id: string
      course_id: string
      teacher_id: string | null
    }>(
      `SELECT cs.id, cs.course_id, c.teacher_id
       FROM course_sessions cs JOIN courses c ON c.id = cs.course_id
       WHERE cs.id = $1`,
      [refId]
    )
    if (rows.length === 0) {
      return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 })
    }
    const s = rows[0]
    platform = 'academy'
    const isTeacher = s.teacher_id === userId
    const isAdmin = ['admin', 'academy_admin'].includes(userRole)
    if (body.stealth && isAdmin) {
      livekitRole = 'stealth'
    } else if (!isTeacher && !isAdmin) {
      const enr = await query<{ id: string }>(
        `SELECT id FROM enrollments
         WHERE course_id = $1 AND student_id = $2 AND status = 'active'`,
        [s.course_id, userId]
      )
      if (enr.length === 0) {
        return NextResponse.json({ error: 'غير مسجل في الدورة' }, { status: 403 })
      }
      livekitRole = 'participant'
    } else {
      livekitRole = 'host'
    }
    roomName = courseSessionRoomName(s.id)
  }

  const settings = await getVideoSettings(platform)

  // Apply room-level config from video_settings before minting the token so
  // LiveKit enforces caps server-side. Idempotent: only takes effect on the
  // first creation of the room.
  try {
    await ensureRoom(roomName, {
      maxParticipants: settings.max_participants,
      // Keep the room open 5 minutes after the last participant leaves so a
      // reconnect doesn't restart the call.
      departureTimeoutSeconds: 300,
      // Reap the room shell after 15 minutes if nobody ever joined.
      emptyTimeoutSeconds: 15 * 60,
      metadata: { kind, refId, platform },
    })
  } catch (err) {
    console.error('[livekit/token] ensureRoom failed', err)
  }

  // require_approval_to_join: non-hosts must be approved before they get a
  // live token. The pending row is created here; the host calls
  // /api/livekit/waiting-room to admit them.
  if (settings.require_approval_to_join && livekitRole !== 'host') {
    try {
      await query(
        `INSERT INTO video_session_pending_joins (kind, ref_id, user_id, status)
         VALUES ($1, $2, $3, 'pending')
         ON CONFLICT (kind, ref_id, user_id)
         DO UPDATE SET status = CASE WHEN video_session_pending_joins.status = 'approved' THEN 'approved' ELSE 'pending' END`,
        [kind, refId, userId]
      )
      const pending = await query<{ status: string }>(
        `SELECT status FROM video_session_pending_joins
         WHERE kind = $1 AND ref_id = $2 AND user_id = $3`,
        [kind, refId, userId]
      )
      const approved = pending[0]?.status === 'approved'
      if (!approved) {
        return NextResponse.json(
          {
            waiting: true,
            message: 'في انتظار موافقة المضيف للسماح بالدخول',
          },
          { status: 202 }
        )
      }
    } catch (err) {
      // Table missing (migration not run) — fall through and behave as if the
      // setting is off. Logged for visibility.
      console.error('[livekit/token] waiting-room check failed', err)
    }
  }

  let videoSessionId: string | null = null
  try {
    if (livekitRole === 'host') {
      const live = await startVideoSession({
        kind,
        refId,
        platform,
        startedBy: userId,
        roomName,
        filenameHint: `${kind}-${refId.slice(0, 8)}`,
      })
      videoSessionId = live.id
    } else {
      const active = await findActiveSession(kind, refId)
      videoSessionId = active?.id || null
    }
    if (videoSessionId) {
      await recordParticipantJoin(videoSessionId, userId, livekitRole)
    }
  } catch (err) {
    console.error('[livekit/token] failed to track session', err)
  }

  try {
    const token = await mintLiveKitToken({
      roomName,
      identity: userId,
      name: userName,
      role: livekitRole,
      metadata: { role: userRole, kind, refId, platform, videoSessionId },
    })

    return NextResponse.json({
      token,
      url: LIVEKIT_URL,
      roomName,
      role: livekitRole,
      identity: userId,
      name: userName,
      platform,
      videoSessionId,
      settings: {
        recording_enabled: settings.recording_enabled,
        recording_auto_start: settings.recording_auto_start,
        allow_chat: settings.allow_chat,
        allow_screen_share: settings.allow_screen_share,
        allow_student_unmute: settings.allow_student_unmute,
        allow_student_video: settings.allow_student_video,
        default_video_quality: settings.default_video_quality,
        default_audio_only: settings.default_audio_only,
        show_participant_count: settings.show_participant_count,
        watermark_text: settings.watermark_text,
        max_participants: settings.max_participants,
        max_duration_minutes: settings.max_duration_minutes,
      },
    })
  } catch (err) {
    console.error('[livekit/token] error', err)
    return NextResponse.json({ error: 'فشل إنشاء رمز الدخول' }, { status: 500 })
  }
}
