import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { abortMultipart } from '@/lib/recordings-s3'

interface RecRow {
  id: string
  uploader_id: string
  upload_id: string | null
  s3_key: string
  status: string
}

/**
 * POST /api/recordings/multipart/abort
 * Body: { recordingId: string }
 *
 * Cancels an in-flight multipart upload. S3 reclaims the storage; we mark
 * the row as 'aborted' so the crash-recovery cron skips it.
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { recordingId?: string }
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
    `SELECT id, uploader_id, upload_id, s3_key, status
     FROM video_recordings WHERE id = $1`,
    [recordingId]
  )
  if (!rec) return NextResponse.json({ error: 'لا يوجد تسجيل' }, { status: 404 })
  if (rec.uploader_id !== session.sub && session.role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  if (rec.status === 'completed') {
    return NextResponse.json({ error: 'الرفع منتهي بالفعل' }, { status: 400 })
  }
  if (rec.upload_id) {
    await abortMultipart(rec.s3_key, rec.upload_id)
  }
  await query(
    `UPDATE video_recordings
     SET status = 'aborted', completed_at = NOW()
     WHERE id = $1`,
    [recordingId]
  )
  return NextResponse.json({ ok: true })
}
