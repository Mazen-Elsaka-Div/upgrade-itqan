import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { ADMIN_ROLES, type HalaqaPlatform } from '@/lib/halaqat'
import {
  buildRecordingUrl,
  isRecordingConfigured,
  startRoomRecording,
  stopEgress,
} from '@/lib/livekit'
import { getVideoSettings } from '@/lib/video-settings'

interface VS {
  id: string
  kind: string
  ref_id: string
  platform: HalaqaPlatform
  room_name: string
  ended_at: string | null
  egress_id: string | null
  recording_status: string
  recording_url: string | null
}

async function authorizeHost(
  session: { sub: string; role: string },
  row: VS
): Promise<boolean> {
  const isAdmin = ADMIN_ROLES[row.platform].includes(session.role)
  if (isAdmin) return true
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

async function load(id: string): Promise<VS | null> {
  return queryOne<VS>(
    `SELECT id, kind, ref_id, platform, room_name, ended_at, egress_id,
            recording_status, recording_url
     FROM video_sessions WHERE id = $1`,
    [id]
  )
}

/** POST — start recording. */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const row = await load(id)
  if (!row) return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 })
  if (!(await authorizeHost(session, row))) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  if (row.ended_at) {
    return NextResponse.json({ error: 'الجلسة منتهية' }, { status: 400 })
  }

  const settings = await getVideoSettings(row.platform)
  if (!settings.recording_enabled) {
    return NextResponse.json(
      { error: 'التسجيل معطل من إعدادات المنصة' },
      { status: 400 }
    )
  }
  if (!isRecordingConfigured()) {
    return NextResponse.json(
      { error: 'تخزين التسجيلات غير مكوّن على الخادم' },
      { status: 503 }
    )
  }
  if (row.egress_id && row.recording_status === 'recording') {
    return NextResponse.json({ data: row })
  }

  try {
    const rec = await startRoomRecording(row.room_name, `${row.kind}-${row.ref_id.slice(0, 8)}`)
    if (!rec) {
      return NextResponse.json({ error: 'فشل بدء التسجيل' }, { status: 500 })
    }
    const url = buildRecordingUrl(rec.filepath)
    await query(
      `UPDATE video_sessions
       SET egress_id = $1, recording_status = 'recording', recording_url = $2
       WHERE id = $3`,
      [rec.egressId, url, id]
    )
    return NextResponse.json({ data: { ...row, egress_id: rec.egressId, recording_status: 'recording', recording_url: url } })
  } catch (err) {
    console.error('[recording] start failed', err)
    await query(
      `UPDATE video_sessions SET recording_status = 'failed' WHERE id = $1`,
      [id]
    )
    return NextResponse.json({ error: 'فشل بدء التسجيل' }, { status: 500 })
  }
}

/** DELETE — stop recording. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const row = await load(id)
  if (!row) return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 })
  if (!(await authorizeHost(session, row))) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  if (row.egress_id) {
    await stopEgress(row.egress_id)
  }
  await query(
    `UPDATE video_sessions SET recording_status = 'completed' WHERE id = $1 AND recording_status = 'recording'`,
    [id]
  )
  return NextResponse.json({ success: true })
}
