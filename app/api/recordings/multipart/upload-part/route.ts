import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { uploadPart } from '@/lib/recordings-s3'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Allow large bodies — a 5 second media chunk at typical encoder bitrates is
// well under 5 MB but we leave headroom for high-quality recordings.
export const maxDuration = 60

interface RecRow {
  id: string
  session_id: string
  uploader_id: string
  upload_id: string | null
  s3_key: string
  status: string
}

/**
 * POST /api/recordings/multipart/upload-part
 *
 * Multipart-form body:
 *   - recordingId: string
 *   - partNumber:  number (1-based)
 *   - chunk:       Blob (the MediaRecorder ondataavailable slice)
 *
 * Streams the chunk directly to S3 under the previously-issued UploadID and
 * records the resulting ETag + size in video_recording_parts so we can
 * Complete (or salvage) later.
 *
 * S3 multipart minimum part size is 5 MB *except for the last part*. We let
 * the browser buffer locally (in-memory only, no IndexedDB) until it has
 * accumulated ≥5 MB before flushing, so the server-side here can just trust
 * what it receives and pass it through.
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'invalid form body' }, { status: 400 })
  }

  const recordingId = String(form.get('recordingId') || '')
  const partNumber = Number(form.get('partNumber') || '0')
  const chunk = form.get('chunk')
  if (!recordingId || !partNumber || partNumber < 1 || partNumber > 10_000) {
    return NextResponse.json({ error: 'recordingId و partNumber مطلوبان' }, { status: 400 })
  }
  if (!(chunk instanceof Blob) || chunk.size === 0) {
    return NextResponse.json({ error: 'chunk مطلوب' }, { status: 400 })
  }

  const rec = await queryOne<RecRow>(
    `SELECT id, session_id, uploader_id, upload_id, s3_key, status
     FROM video_recordings WHERE id = $1`,
    [recordingId]
  )
  if (!rec) return NextResponse.json({ error: 'لا يوجد تسجيل' }, { status: 404 })
  if (rec.uploader_id !== session.sub && session.role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  if (rec.status === 'completed' || rec.status === 'aborted') {
    return NextResponse.json({ error: 'الرفع منتهي بالفعل' }, { status: 400 })
  }
  if (!rec.upload_id) {
    return NextResponse.json({ error: 'لا يوجد UploadID' }, { status: 400 })
  }

  // Convert the incoming Blob to Buffer for the S3 SDK.
  const buf = Buffer.from(await chunk.arrayBuffer())

  let result
  try {
    result = await uploadPart(rec.s3_key, rec.upload_id, partNumber, buf)
  } catch (err) {
    console.error('[recordings/upload-part] S3 error', err)
    return NextResponse.json({ error: 'فشل رفع الجزء إلى S3' }, { status: 502 })
  }
  if (!result) {
    return NextResponse.json({ error: 'فشل رفع الجزء' }, { status: 502 })
  }

  await query(
    `INSERT INTO video_recording_parts (recording_id, part_number, etag, size_bytes)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (recording_id, part_number)
     DO UPDATE SET etag = EXCLUDED.etag, size_bytes = EXCLUDED.size_bytes, uploaded_at = NOW()`,
    [recordingId, partNumber, result.etag, result.size]
  )

  await query(
    `UPDATE video_recordings
     SET bytes_uploaded = (
           SELECT COALESCE(SUM(size_bytes), 0) FROM video_recording_parts WHERE recording_id = $1
         ),
         parts_count = (
           SELECT COUNT(*) FROM video_recording_parts WHERE recording_id = $1
         ),
         last_part_at = NOW(),
         status = 'uploading'
     WHERE id = $1`,
    [recordingId]
  )

  return NextResponse.json({
    ok: true,
    partNumber,
    etag: result.etag,
    size: result.size,
  })
}
