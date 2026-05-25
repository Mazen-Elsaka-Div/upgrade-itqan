/**
 * Server helpers for the unified video_sessions table — the single source of
 * truth for any LiveKit-powered meeting (halaqat, bookings, course sessions).
 */

import { query, queryOne } from '@/lib/db'
import {
  halaqaRoomName,
  bookingRoomName,
  courseSessionRoomName,
  startRoomRecording,
  stopEgress,
  buildRecordingUrl,
  isRecordingConfigured,
} from '@/lib/livekit'
import type { HalaqaPlatform } from '@/lib/halaqat'
import { getVideoSettings } from '@/lib/video-settings'

export type VideoSessionKind = 'halaqa' | 'booking' | 'course_session'

export interface VideoSessionRow {
  id: string
  kind: VideoSessionKind
  ref_id: string
  platform: HalaqaPlatform
  room_name: string
  started_by: string | null
  started_at: string
  ended_at: string | null
  egress_id: string | null
  recording_status: 'disabled' | 'pending' | 'recording' | 'completed' | 'failed'
  recording_url: string | null
  peak_participants: number
  total_participants: number
  duration_seconds: number | null
  notes: string | null
}

export function roomNameFor(kind: VideoSessionKind, refId: string): string {
  switch (kind) {
    case 'halaqa':
      return halaqaRoomName(refId)
    case 'booking':
      return bookingRoomName(refId)
    case 'course_session':
      return courseSessionRoomName(refId)
  }
}

export async function findActiveSession(
  kind: VideoSessionKind,
  refId: string
): Promise<VideoSessionRow | null> {
  return queryOne<VideoSessionRow>(
    `SELECT * FROM video_sessions
     WHERE kind = $1 AND ref_id = $2 AND ended_at IS NULL
     ORDER BY started_at DESC LIMIT 1`,
    [kind, refId]
  )
}

export interface StartSessionArgs {
  kind: VideoSessionKind
  refId: string
  platform: HalaqaPlatform
  startedBy: string
  /** Override the default room name (we use the deterministic helpers otherwise). */
  roomName?: string
  /** Title hint for the recording filename. */
  filenameHint?: string
}

/**
 * Mark a session as live. Idempotent: returns the existing live session if
 * one is already running. Also kicks off recording when the platform's
 * video_settings have recording enabled + auto-start.
 */
export async function startVideoSession(args: StartSessionArgs): Promise<VideoSessionRow> {
  const existing = await findActiveSession(args.kind, args.refId)
  if (existing) return existing

  const roomName = args.roomName || roomNameFor(args.kind, args.refId)
  const inserted = await queryOne<VideoSessionRow>(
    `INSERT INTO video_sessions (
       kind, ref_id, platform, room_name, started_by, started_at, recording_status
     ) VALUES ($1, $2, $3, $4, $5, NOW(), 'disabled')
     RETURNING *`,
    [args.kind, args.refId, args.platform, roomName, args.startedBy]
  )

  if (!inserted) throw new Error('Failed to create video session row')

  const settings = await getVideoSettings(args.platform)
  if (
    settings.recording_enabled &&
    settings.recording_auto_start &&
    isRecordingConfigured()
  ) {
    try {
      const rec = await startRoomRecording(
        roomName,
        args.filenameHint || `${args.kind}-${args.refId.slice(0, 8)}`
      )
      if (rec) {
        await query(
          `UPDATE video_sessions
           SET egress_id = $1,
               recording_status = 'recording',
               recording_url = $2
           WHERE id = $3`,
          [rec.egressId, buildRecordingUrl(rec.filepath), inserted.id]
        )
        inserted.egress_id = rec.egressId
        inserted.recording_status = 'recording'
        inserted.recording_url = buildRecordingUrl(rec.filepath)
      }
    } catch (err) {
      console.error('[video-sessions] failed to start recording', err)
      await query(
        `UPDATE video_sessions SET recording_status = 'failed' WHERE id = $1`,
        [inserted.id]
      )
    }
  }

  // Keep halaqat_live_sessions in sync for backwards-compatible reads.
  if (args.kind === 'halaqa') {
    await query(
      `INSERT INTO halaqat_live_sessions (id, halaqah_id, started_by, livekit_room_name, started_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (id) DO NOTHING`,
      [inserted.id, args.refId, args.startedBy, roomName]
    )
  }

  return inserted
}

export async function endVideoSession(sessionId: string): Promise<void> {
  const row = await queryOne<VideoSessionRow>(
    `SELECT * FROM video_sessions WHERE id = $1`,
    [sessionId]
  )
  if (!row || row.ended_at) return

  if (row.egress_id && row.recording_status === 'recording') {
    await stopEgress(row.egress_id)
    await query(
      `UPDATE video_sessions SET recording_status = 'completed' WHERE id = $1`,
      [sessionId]
    )
  }

  // Close any participants who never received a participant_left webhook so
  // their attendance window is bounded.
  await query(
    `UPDATE video_session_participants
     SET left_at = NOW(),
         duration_seconds = EXTRACT(EPOCH FROM (NOW() - joined_at))::int
     WHERE session_id = $1 AND left_at IS NULL`,
    [sessionId]
  )

  await query(
    `UPDATE video_sessions
     SET ended_at = NOW(),
         duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::int
     WHERE id = $1`,
    [sessionId]
  )

  if (row.kind === 'halaqa') {
    await query(
      `UPDATE halaqat_live_sessions
       SET ended_at = NOW(), participants_count = $2
       WHERE id = $1 AND ended_at IS NULL`,
      [sessionId, row.peak_participants]
    )
  }
}

/**
 * Record a participant joining a live session. Increments the totals and
 * keeps peak_participants up to date.
 */
export async function recordParticipantJoin(
  sessionId: string,
  userId: string,
  role: 'host' | 'participant' | 'viewer'
): Promise<void> {
  // Insert a join record only if the user isn't currently live in the session.
  const open = await queryOne<{ id: string }>(
    `SELECT id FROM video_session_participants
     WHERE session_id = $1 AND user_id = $2 AND left_at IS NULL`,
    [sessionId, userId]
  )
  if (open) return

  await query(
    `INSERT INTO video_session_participants (session_id, user_id, role, joined_at)
     VALUES ($1, $2, $3, NOW())`,
    [sessionId, userId, role]
  )
  await query(
    `UPDATE video_sessions
     SET total_participants = total_participants + 1,
         peak_participants = GREATEST(peak_participants, (
           SELECT COUNT(*)::int FROM video_session_participants
           WHERE session_id = $1 AND left_at IS NULL
         ))
     WHERE id = $1`,
    [sessionId]
  )
}

export async function recordParticipantLeave(
  sessionId: string,
  userId: string
): Promise<void> {
  await query(
    `UPDATE video_session_participants
     SET left_at = NOW(),
         duration_seconds = EXTRACT(EPOCH FROM (NOW() - joined_at))::int
     WHERE session_id = $1 AND user_id = $2 AND left_at IS NULL`,
    [sessionId, userId]
  )
}
