import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import {
  abortMultipart,
  buildRecordingObjectUrl,
  completeMultipart,
  listMultipartParts,
} from '@/lib/recordings-s3'

/**
 * Crash recovery for client-side multipart recordings.
 *
 * Looks for recordings that:
 *   - status = 'uploading'
 *   - last_part_at is older than INACTIVE_THRESHOLD_MINUTES (default 10)
 *
 * For each one we re-list the parts that S3 actually persisted and try to
 * complete the multipart upload anyway, salvaging whatever the browser
 * succeeded in uploading before it crashed. If S3 has zero parts (or
 * completion fails), we abort the upload to release storage.
 */
export const dynamic = 'force-dynamic'

const DEFAULT_INACTIVE_MIN = 10

export async function GET() {
  const thresholdMin = Number(process.env.RECORDING_RECOVER_THRESHOLD_MIN || DEFAULT_INACTIVE_MIN)

  const stale = await query<{
    id: string
    session_id: string
    upload_id: string | null
    s3_key: string
    mime_type: string
  }>(
    `SELECT id, session_id, upload_id, s3_key, mime_type
     FROM video_recordings
     WHERE status = 'uploading'
       AND last_part_at IS NOT NULL
       AND last_part_at < NOW() - ($1 || ' minutes')::interval`,
    [String(thresholdMin)]
  )

  let recovered = 0
  let aborted = 0
  let skipped = 0
  for (const row of stale) {
    if (!row.upload_id) {
      skipped++
      continue
    }
    let parts
    try {
      parts = await listMultipartParts(row.s3_key, row.upload_id)
    } catch (err) {
      console.error('[cron/recover-multipart] listParts failed', err)
      skipped++
      continue
    }
    if (parts.length === 0) {
      // Nothing to assemble — release storage and mark aborted.
      await abortMultipart(row.s3_key, row.upload_id)
      await query(
        `UPDATE video_recordings SET status = 'aborted', completed_at = NOW() WHERE id = $1`,
        [row.id]
      )
      aborted++
      continue
    }

    try {
      const url = await completeMultipart(row.s3_key, row.upload_id, parts)
      const finalUrl = url || buildRecordingObjectUrl(row.s3_key)
      await query(
        `UPDATE video_recordings
         SET status = 'completed',
             recording_url = $1,
             completed_at = NOW(),
             parts_count = $2,
             bytes_uploaded = $3
         WHERE id = $4`,
        [finalUrl, parts.length, parts.reduce((s, p) => s + (p.size || 0), 0), row.id]
      )
      await query(
        `UPDATE video_sessions
         SET recording_status = 'completed',
             recording_url = COALESCE(recording_url, $1)
         WHERE id = $2`,
        [finalUrl, row.session_id]
      )
      recovered++
    } catch (err) {
      console.error('[cron/recover-multipart] complete failed, aborting', err)
      await abortMultipart(row.s3_key, row.upload_id)
      await query(
        `UPDATE video_recordings SET status = 'failed', completed_at = NOW() WHERE id = $1`,
        [row.id]
      )
      aborted++
    }
  }

  return NextResponse.json({
    ok: true,
    checked: stale.length,
    recovered,
    aborted,
    skipped,
  })
}
