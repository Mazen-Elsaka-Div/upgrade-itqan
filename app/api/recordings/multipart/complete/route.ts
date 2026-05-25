import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import {
  buildRecordingObjectUrl,
  completeMultipart,
  listMultipartParts,
} from '@/lib/recordings-s3'

interface RecRow {
  id: string
  session_id: string
  uploader_id: string
  upload_id: string | null
  s3_key: string
  status: string
  mime_type: string
}

/**
 * POST /api/recordings/multipart/complete
 * Body: { recordingId: string, durationSeconds?: number }
 *
 * Assembles all uploaded parts on S3, finalises the recording row, mirrors
 * the playback URL onto the parent video_session row, and marks the
 * multipart upload as completed.
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { recordingId?: string; durationSeconds?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }
  const recordingId = body.recordingId
  if (!recordingId) {
    return NextResponse.json({ error: 'recordingId مطلوب' }, { status: 400 })
  }

  const rec = await queryOne<RecRow>(
    `SELECT id, session_id, uploader_id, upload_id, s3_key, status, mime_type
     FROM video_recordings WHERE id = $1`,
    [recordingId]
  )
  if (!rec) return NextResponse.json({ error: 'لا يوجد تسجيل' }, { status: 404 })
  if (rec.uploader_id !== session.sub && session.role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  if (rec.status === 'completed') {
    return NextResponse.json({
      ok: true,
      recordingId,
      url: buildRecordingObjectUrl(rec.s3_key),
    })
  }
  if (!rec.upload_id) {
    return NextResponse.json({ error: 'لا يوجد UploadID' }, { status: 400 })
  }

  // We re-read parts from S3 itself so we never assemble with a stale
  // DB state — this matters for crash recovery where the DB may be missing
  // the very last part that S3 successfully received.
  const parts = await listMultipartParts(rec.s3_key, rec.upload_id)
  if (parts.length === 0) {
    return NextResponse.json({ error: 'لم يتم رفع أي جزء بعد' }, { status: 400 })
  }

  let url: string | null
  try {
    url = await completeMultipart(rec.s3_key, rec.upload_id, parts)
  } catch (err) {
    console.error('[recordings/complete] S3 error', err)
    await query(
      `UPDATE video_recordings SET status = 'failed' WHERE id = $1`,
      [recordingId]
    )
    return NextResponse.json({ error: 'فشل تجميع الأجزاء على S3' }, { status: 502 })
  }
  if (!url) url = buildRecordingObjectUrl(rec.s3_key)

  const durationSeconds = typeof body.durationSeconds === 'number' && body.durationSeconds > 0
    ? Math.round(body.durationSeconds)
    : null

  await query(
    `UPDATE video_recordings
     SET status = 'completed',
         recording_url = $1,
         duration_seconds = $2,
         completed_at = NOW(),
         parts_count = $3,
         bytes_uploaded = $4
     WHERE id = $5`,
    [
      url,
      durationSeconds,
      parts.length,
      parts.reduce((s, p) => s + (p.size || 0), 0),
      recordingId,
    ]
  )

  // Mirror onto the video_sessions row so the existing recordings index, /api
  // routes and UIs see the playback URL without changing their queries.
  await query(
    `UPDATE video_sessions
     SET recording_status = 'completed',
         recording_url = COALESCE(recording_url, $1)
     WHERE id = $2`,
    [url, rec.session_id]
  )

  return NextResponse.json({ ok: true, recordingId, url, parts: parts.length })
}
