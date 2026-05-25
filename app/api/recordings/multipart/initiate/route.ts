import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { ADMIN_ROLES, type HalaqaPlatform } from '@/lib/halaqat'
import { getVideoSettings } from '@/lib/video-settings'
import {
  buildObjectKey,
  buildRecordingObjectUrl,
  getRecordingS3Config,
  initiateMultipart,
  isClientRecordingConfigured,
} from '@/lib/recordings-s3'

interface VSRow {
  id: string
  kind: string
  ref_id: string
  platform: HalaqaPlatform
  ended_at: string | null
  started_by: string | null
}

async function authorizeHost(
  session: { sub: string; role: string },
  row: VSRow
): Promise<boolean> {
  if (row.started_by === session.sub) return true
  if (ADMIN_ROLES[row.platform].includes(session.role)) return true
  if (row.kind === 'halaqa') {
    const h = await queryOne<{ teacher_id: string | null }>(
      `SELECT teacher_id FROM halaqat WHERE id = $1`,
      [row.ref_id]
    )
    return h?.teacher_id === session.sub
  }
  if (row.kind === 'booking') {
    const b = await queryOne<{ reader_id: string }>(
      `SELECT reader_id FROM bookings WHERE id = $1`,
      [row.ref_id]
    )
    return b?.reader_id === session.sub
  }
  if (row.kind === 'course_session') {
    const cs = await queryOne<{ teacher_id: string }>(
      `SELECT c.teacher_id FROM course_sessions cs JOIN courses c ON c.id = cs.course_id WHERE cs.id = $1`,
      [row.ref_id]
    )
    return cs?.teacher_id === session.sub
  }
  return false
}

/**
 * POST /api/recordings/multipart/initiate
 * Body: { sessionId: string, mimeType?: string }
 *
 * Opens an S3 multipart upload for the given live video session, writes a
 * tracking row to video_recordings, and returns the per-part upload metadata
 * the browser needs (uploadId + recordingId).
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isClientRecordingConfigured()) {
    return NextResponse.json(
      { error: 'تخزين التسجيلات غير مكوّن. يمكن للمسؤول إعداد بيئة الـ S3 أو الاعتماد على LiveKit Egress.', code: 'NOT_CONFIGURED' },
      { status: 503 }
    )
  }

  let body: { sessionId?: string; mimeType?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }
  const sessionId = body.sessionId
  if (!sessionId) return NextResponse.json({ error: 'sessionId مطلوب' }, { status: 400 })
  const mimeType = body.mimeType || 'video/webm'
  if (!/^video\/(webm|mp4)/i.test(mimeType)) {
    return NextResponse.json({ error: 'نوع الملف غير مدعوم' }, { status: 400 })
  }

  const row = await queryOne<VSRow>(
    `SELECT id, kind, ref_id, platform, ended_at, started_by
     FROM video_sessions WHERE id = $1`,
    [sessionId]
  )
  if (!row) return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 })
  if (row.ended_at) {
    return NextResponse.json({ error: 'الجلسة منتهية' }, { status: 400 })
  }
  if (!(await authorizeHost(session, row))) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const settings = await getVideoSettings(row.platform)
  if (!settings.recording_enabled) {
    return NextResponse.json({ error: 'التسجيل معطل من إعدادات المنصة' }, { status: 400 })
  }

  const cfg = getRecordingS3Config()
  if (!cfg) {
    return NextResponse.json({ error: 'تخزين التسجيلات غير مكوّن' }, { status: 503 })
  }

  const recordingId = randomUUID()
  const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
  const key = buildObjectKey({ sessionId, recordingId, ext })

  const initRes = await initiateMultipart(key, mimeType)
  if (!initRes) {
    return NextResponse.json({ error: 'فشل بدء الرفع متعدد الأجزاء' }, { status: 500 })
  }

  await query(
    `INSERT INTO video_recordings
       (id, session_id, uploader_id, source, s3_bucket, s3_key, s3_region,
        upload_id, mime_type, status, started_at)
     VALUES ($1, $2, $3, 'client', $4, $5, $6, $7, $8, 'uploading', NOW())`,
    [recordingId, sessionId, session.sub, cfg.bucket, key, cfg.region, initRes.uploadId, mimeType]
  )

  // Mirror state on the parent session so the existing UI keeps working.
  await query(
    `UPDATE video_sessions
     SET recording_status = 'recording'
     WHERE id = $1 AND recording_status != 'completed'`,
    [sessionId]
  )

  return NextResponse.json({
    recordingId,
    uploadId: initRes.uploadId,
    bucket: cfg.bucket,
    key,
    region: cfg.region,
    mimeType,
    publicUrl: buildRecordingObjectUrl(key),
  })
}
