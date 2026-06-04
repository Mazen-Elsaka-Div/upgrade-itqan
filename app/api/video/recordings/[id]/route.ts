import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { deleteRecordingObject, extractKeyFromUrl } from '@/lib/recordings-s3'

const ADMIN_BY_PLATFORM: Record<string, string[]> = {
  academy: ['admin', 'academy_admin'],
  maqraa: ['admin', 'reciter_supervisor'],
}

/**
 * DELETE /api/video/recordings/[id]
 *
 * Deletes the recording(s) attached to a video_session:
 *   - removes the underlying S3 object(s)
 *   - deletes video_recordings rows (cascades to parts)
 *   - clears video_sessions.recording_url
 *
 * The session row itself is preserved (it remains in history). Only the host
 * who started the session or a platform admin may delete.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if (!id) return NextResponse.json({ error: 'معرّف غير صالح' }, { status: 400 })

  // Load the session to authorize and gather the legacy recording_url.
  const sessionRows = await query<{
    id: string
    platform: string | null
    started_by: string | null
    recording_url: string | null
  }>(
    `SELECT id, platform, started_by, recording_url
     FROM video_sessions WHERE id = $1 LIMIT 1`,
    [id]
  )
  const vs = sessionRows[0]
  if (!vs) return NextResponse.json({ error: 'التسجيل غير موجود' }, { status: 404 })

  const isHost = vs.started_by === session.sub
  const isAdmin = (ADMIN_BY_PLATFORM[vs.platform || ''] || []).includes(session.role)
  if (!isHost && !isAdmin) {
    return NextResponse.json({ error: 'غير مصرح لك بحذف هذا التسجيل' }, { status: 403 })
  }

  // Collect every S3 key tied to this session.
  const recRows = await query<{ s3_key: string | null; recording_url: string | null }>(
    `SELECT s3_key, recording_url FROM video_recordings WHERE session_id = $1`,
    [id]
  )

  const keys = new Set<string>()
  for (const r of recRows) {
    if (r.s3_key) keys.add(r.s3_key)
    else if (r.recording_url) {
      const k = extractKeyFromUrl(r.recording_url)
      if (k) keys.add(k)
    }
  }
  if (vs.recording_url) {
    const k = extractKeyFromUrl(vs.recording_url)
    if (k) keys.add(k)
  }

  // Best-effort S3 cleanup; never block the DB cleanup on a storage error.
  await Promise.all(Array.from(keys).map((k) => deleteRecordingObject(k)))

  // Remove DB references (video_recording_parts cascades from video_recordings).
  await query(`DELETE FROM video_recordings WHERE session_id = $1`, [id])
  await query(`UPDATE video_sessions SET recording_url = NULL WHERE id = $1`, [id])

  return NextResponse.json({ ok: true })
}
