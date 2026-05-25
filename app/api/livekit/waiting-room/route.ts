import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

/**
 * Waiting-room queue management.
 *
 * GET /api/livekit/waiting-room?kind=halaqa|booking|course_session&id=<refId>
 *   Host-only. Returns the pending requests for that entity.
 *
 * POST /api/livekit/waiting-room
 *   Body: { kind, id, userId, action: 'approve' | 'deny' }
 *   Host-only. Records a decision; the requester polls /api/livekit/token
 *   again to actually mint a token after approval.
 *
 * The "host" determination is intentionally simple: the user that started
 * the live video_session (or the owner of the underlying entity) is allowed
 * to admit pending requests. Platform admins can always admit.
 */
async function isHostOf(
  kind: string,
  refId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  if (['admin', 'academy_admin', 'reciter_supervisor'].includes(userRole)) return true
  if (kind === 'halaqa') {
    const row = await queryOne<{ teacher_id: string | null }>(
      `SELECT teacher_id FROM halaqat WHERE id = $1`,
      [refId]
    )
    return row?.teacher_id === userId
  }
  if (kind === 'booking') {
    const row = await queryOne<{ reader_id: string }>(
      `SELECT reader_id FROM bookings WHERE id = $1`,
      [refId]
    )
    return row?.reader_id === userId
  }
  if (kind === 'course_session') {
    const row = await queryOne<{ teacher_id: string | null }>(
      `SELECT c.teacher_id FROM course_sessions cs
       JOIN courses c ON c.id = cs.course_id WHERE cs.id = $1`,
      [refId]
    )
    return row?.teacher_id === userId
  }
  return false
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const kind = url.searchParams.get('kind') || ''
  const refId = url.searchParams.get('id') || ''
  if (!['halaqa', 'booking', 'course_session'].includes(kind) || !refId) {
    return NextResponse.json({ error: 'kind و id مطلوبان' }, { status: 400 })
  }
  if (!(await isHostOf(kind, refId, session.sub, session.role))) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const pending = await query<{
    id: string
    user_id: string
    user_name: string
    user_email: string
    status: string
    created_at: string
  }>(
    `SELECT p.id, p.user_id, u.name AS user_name, u.email AS user_email, p.status, p.created_at
     FROM video_session_pending_joins p
     JOIN users u ON u.id = p.user_id
     WHERE p.kind = $1 AND p.ref_id = $2
     ORDER BY p.created_at ASC`,
    [kind, refId]
  )
  return NextResponse.json({ data: pending })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { kind?: string; id?: string; userId?: string; action?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const { kind, id: refId, userId, action } = body
  if (!kind || !refId || !userId || !['approve', 'deny'].includes(action || '')) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  }
  if (!(await isHostOf(kind, refId, session.sub, session.role))) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  const newStatus = action === 'approve' ? 'approved' : 'denied'
  const rows = await query<{ id: string; status: string }>(
    `UPDATE video_session_pending_joins
     SET status = $1, approved_by = $2, approved_at = NOW(), updated_at = NOW()
     WHERE kind = $3 AND ref_id = $4 AND user_id = $5
     RETURNING id, status`,
    [newStatus, session.sub, kind, refId, userId]
  )
  if (rows.length === 0) {
    return NextResponse.json({ error: 'لا يوجد طلب لهذا المستخدم' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, status: rows[0].status })
}
