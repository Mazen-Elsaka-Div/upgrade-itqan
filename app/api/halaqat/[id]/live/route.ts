import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { ADMIN_ROLES, type HalaqaPlatform } from '@/lib/halaqat'
import { halaqaRoomName, listRoomParticipants } from '@/lib/livekit'
import {
  endVideoSession,
  findActiveSession,
  startVideoSession,
} from '@/lib/video-sessions'

async function loadHalaqaShort(id: string) {
  return queryOne<{
    id: string
    teacher_id: string | null
    livekit_room_name: string | null
    platform: HalaqaPlatform
  }>(
    `SELECT id, teacher_id, livekit_room_name, platform FROM halaqat WHERE id = $1`,
    [id]
  )
}

/**
 * GET /api/halaqat/[id]/live
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const halaqa = await loadHalaqaShort(id)
  if (!halaqa) return NextResponse.json({ error: 'الحلقة غير موجودة' }, { status: 404 })

  const active = await findActiveSession('halaqa', id)
  const roomName = halaqa.livekit_room_name || halaqaRoomName(halaqa.id)

  let participants: { identity: string; name?: string; joinedAt?: number }[] = []
  if (active) {
    const lkParticipants = await listRoomParticipants(roomName)
    participants = lkParticipants.map((p) => ({
      identity: p.identity,
      name: p.name,
      joinedAt: Number(p.joinedAt),
    }))
  }

  return NextResponse.json({
    active,
    participants,
    room_name: roomName,
  })
}

/**
 * POST /api/halaqat/[id]/live — start the live session (idempotent).
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const halaqa = await loadHalaqaShort(id)
  if (!halaqa) return NextResponse.json({ error: 'الحلقة غير موجودة' }, { status: 404 })

  const isAdmin = ADMIN_ROLES[halaqa.platform].includes(session.role)
  const isOwner = halaqa.teacher_id === session.sub
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const data = await startVideoSession({
    kind: 'halaqa',
    refId: id,
    platform: halaqa.platform,
    startedBy: session.sub,
    roomName: halaqa.livekit_room_name || halaqaRoomName(halaqa.id),
    filenameHint: `halaqa-${id.slice(0, 8)}`,
  })
  return NextResponse.json({ data, status: 201 })
}

/**
 * DELETE /api/halaqat/[id]/live — end the live session.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const halaqa = await loadHalaqaShort(id)
  if (!halaqa) return NextResponse.json({ error: 'الحلقة غير موجودة' }, { status: 404 })

  const isAdmin = ADMIN_ROLES[halaqa.platform].includes(session.role)
  const isOwner = halaqa.teacher_id === session.sub
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const active = await findActiveSession('halaqa', id)
  if (active) {
    await endVideoSession(active.id)
  }
  // Also close any legacy halaqat_live_sessions row that wasn't tied to a
  // video_sessions row (older data).
  await query(
    `UPDATE halaqat_live_sessions SET ended_at = NOW()
     WHERE halaqah_id = $1 AND ended_at IS NULL`,
    [id]
  )
  return NextResponse.json({ success: true })
}
