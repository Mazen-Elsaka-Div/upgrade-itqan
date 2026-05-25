import { NextRequest, NextResponse } from 'next/server'
import { WebhookReceiver } from 'livekit-server-sdk'
import { query } from '@/lib/db'
import { endVideoSession, recordParticipantLeave } from '@/lib/video-sessions'

/**
 * LiveKit webhook receiver.
 *
 * LiveKit Cloud / self-hosted servers POST events here for the lifecycle
 * of rooms, participants, egresses, etc. We rely on it for:
 *   - participant_left → close `video_session_participants.left_at`
 *   - room_finished    → mark the parent video_session ended_at
 *   - egress_ended     → flip recording_status from 'recording' → 'completed'
 *
 * The body is signed via the `Authorization` header. Set
 *   LIVEKIT_API_KEY / LIVEKIT_API_SECRET on the server (already required for
 *   token minting). Configure the webhook URL in the LiveKit project to point
 *   at `/api/livekit/webhook`.
 */
export const dynamic = 'force-dynamic'

const apiKey = process.env.LIVEKIT_API_KEY || ''
const apiSecret = process.env.LIVEKIT_API_SECRET || ''
const receiver = apiKey && apiSecret ? new WebhookReceiver(apiKey, apiSecret) : null

export async function POST(req: NextRequest) {
  if (!receiver) {
    return NextResponse.json(
      { error: 'LiveKit credentials are not configured' },
      { status: 503 }
    )
  }

  let raw: string
  try {
    raw = await req.text()
  } catch {
    return NextResponse.json({ error: 'cannot read body' }, { status: 400 })
  }

  const authHeader = req.headers.get('authorization') || undefined
  let event
  try {
    event = await receiver.receive(raw, authHeader)
  } catch (err) {
    console.error('[livekit/webhook] verification failed', err)
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  try {
    switch (event.event) {
      case 'participant_left': {
        await handleParticipantLeft(
          event.room?.name || '',
          event.participant?.identity || ''
        )
        break
      }
      case 'participant_joined': {
        // We already record the join when the token is minted, but if a user
        // somehow joins with a token that bypassed the API (shouldn't happen
        // in our setup) we re-confirm the session exists so participant_left
        // can find it later. No-op here unless we extend it.
        break
      }
      case 'room_finished': {
        await handleRoomFinished(event.room?.name || '')
        break
      }
      case 'egress_ended': {
        await handleEgressEnded(
          event.egressInfo?.egressId || '',
          event.egressInfo?.status || 0
        )
        break
      }
      default:
        break
    }
  } catch (err) {
    // Don't fail the webhook — LiveKit will retry, and we want to be lenient.
    console.error('[livekit/webhook] handler error', err, event.event)
  }

  return NextResponse.json({ ok: true })
}

async function handleParticipantLeft(roomName: string, identity: string) {
  if (!roomName || !identity) return
  // Map room → most recent live session. If none is live we can still close
  // the participant row on the most recently ended session of that room.
  const rows = await query<{ id: string }>(
    `SELECT id FROM video_sessions
     WHERE room_name = $1
     ORDER BY started_at DESC
     LIMIT 1`,
    [roomName]
  )
  if (rows.length === 0) return
  const sessionId = rows[0].id

  // Guest identities (e.g. guest-abc123) don't reference a real user row.
  if (identity.startsWith('guest-')) return
  await recordParticipantLeave(sessionId, identity)
}

async function handleRoomFinished(roomName: string) {
  if (!roomName) return
  const rows = await query<{ id: string }>(
    `SELECT id FROM video_sessions
     WHERE room_name = $1 AND ended_at IS NULL
     ORDER BY started_at DESC
     LIMIT 1`,
    [roomName]
  )
  for (const r of rows) {
    // Make sure any participants left dangling are closed too.
    await query(
      `UPDATE video_session_participants
       SET left_at = NOW(),
           duration_seconds = EXTRACT(EPOCH FROM (NOW() - joined_at))::int
       WHERE session_id = $1 AND left_at IS NULL`,
      [r.id]
    )
    await endVideoSession(r.id)
  }
}

async function handleEgressEnded(egressId: string, status: number) {
  if (!egressId) return
  // LiveKit egress status: EGRESS_COMPLETE = 2, EGRESS_FAILED = 3, etc.
  const completed = status === 2
  await query(
    `UPDATE video_sessions
     SET recording_status = $2
     WHERE egress_id = $1`,
    [egressId, completed ? 'completed' : 'failed']
  )
}
