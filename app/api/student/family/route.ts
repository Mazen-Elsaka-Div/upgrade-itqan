import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

/**
 * Student "family" center — used by both the academy student portal
 * (/academy/student/family) and the maqraa student portal (/student/family).
 * Both portals are the same `users` row with role 'student', so a single
 * portal-neutral endpoint serves both.
 *
 * GET  → { requests, parents, siblings }
 *   - requests : incoming parent link requests (pending + history)
 *   - parents  : currently linked (active) guardians with their contact data
 *   - siblings : other active children that share at least one of my parents
 *
 * POST → { request_id, action: 'approve' | 'reject' | 'unlink' }
 */

const ACTIVE = 'active'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  const me = session.sub

  // 1) Incoming parent link requests (any status) addressed to this student.
  const requests = await query<{
    id: string
    parent_id: string
    parent_name: string
    parent_email: string
    parent_avatar: string | null
    relation: string
    status: string
    created_at: string
  }>(
    `SELECT pc.id, pc.parent_id,
            u.name AS parent_name, u.email AS parent_email, u.avatar_url AS parent_avatar,
            pc.relation, pc.status, pc.created_at
       FROM parent_children pc
       JOIN users u ON u.id = pc.parent_id
      WHERE pc.child_id = $1
      ORDER BY CASE WHEN pc.status = 'pending' THEN 0 ELSE 1 END, pc.created_at DESC`,
    [me]
  ).catch(() => [])

  // 2) Active linked parents with full contact data.
  const parents = await query<{
    link_id: string
    parent_id: string
    name: string
    email: string
    phone: string | null
    city: string | null
    gender: string | null
    avatar_url: string | null
    relation: string
    linked_since: string
  }>(
    `SELECT pc.id AS link_id, pc.parent_id,
            u.name, u.email, u.phone, u.city, u.gender, u.avatar_url,
            pc.relation, COALESCE(pc.confirmed_at, pc.updated_at, pc.created_at) AS linked_since
       FROM parent_children pc
       JOIN users u ON u.id = pc.parent_id
      WHERE pc.child_id = $1 AND pc.status = $2
      ORDER BY pc.created_at DESC`,
    [me, ACTIVE]
  ).catch(() => [])

  // 3) Siblings: other active children sharing any of my active parents.
  const siblings = await query<{
    student_id: string
    name: string
    avatar_url: string | null
    gender: string | null
    relation: string
    parent_name: string
  }>(
    `SELECT DISTINCT ON (s.id)
            s.id AS student_id, s.name, s.avatar_url, s.gender,
            sib.relation, pu.name AS parent_name
       FROM parent_children mine
       JOIN parent_children sib
         ON sib.parent_id = mine.parent_id
        AND sib.child_id <> mine.child_id
        AND sib.status = $2
       JOIN users s  ON s.id = sib.child_id
       JOIN users pu ON pu.id = sib.parent_id
      WHERE mine.child_id = $1 AND mine.status = $2
      ORDER BY s.id, sib.created_at DESC`,
    [me, ACTIVE]
  ).catch(() => [])

  return NextResponse.json({ requests, parents, siblings })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  const me = session.sub

  const body = await req.json().catch(() => ({}))
  const { request_id, action } = body as { request_id?: string; action?: string }

  if (!request_id || !['approve', 'reject', 'unlink'].includes(action || '')) {
    return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
  }

  const link = await queryOne<{ id: string; parent_id: string; status: string }>(
    `SELECT id, parent_id, status FROM parent_children WHERE id = $1 AND child_id = $2`,
    [request_id, me]
  )
  if (!link) {
    return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })
  }

  const student = await queryOne<{ name: string }>(`SELECT name FROM users WHERE id = $1`, [me])
  const studentName = student?.name || 'الطالب'

  let newStatus: string
  let title: string
  let message: string

  if (action === 'approve') {
    if (link.status !== 'pending') {
      return NextResponse.json({ error: 'تم الرد على هذا الطلب مسبقاً' }, { status: 400 })
    }
    newStatus = 'active'
    await query(
      `UPDATE parent_children SET status = 'active', confirmed_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [request_id]
    )
    title = 'تم قبول طلب الربط'
    message = `وافق ${studentName} على ربط حسابه بحسابك. يمكنك الآن متابعة تقدمه.`
  } else if (action === 'reject') {
    if (link.status !== 'pending') {
      return NextResponse.json({ error: 'تم الرد على هذا الطلب مسبقاً' }, { status: 400 })
    }
    newStatus = 'rejected'
    await query(
      `UPDATE parent_children SET status = 'rejected', rejected_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [request_id]
    )
    title = 'تم رفض طلب الربط'
    message = `رفض ${studentName} طلب ربط الحساب.`
  } else {
    // unlink — only an active link can be removed
    if (link.status !== 'active') {
      return NextResponse.json({ error: 'لا يوجد ربط نشط لإلغائه' }, { status: 400 })
    }
    newStatus = 'removed'
    await query(
      `UPDATE parent_children SET status = 'removed', updated_at = NOW() WHERE id = $1`,
      [request_id]
    )
    title = 'تم إلغاء الربط'
    message = `ألغى ${studentName} ربط حسابه بحسابك.`
  }

  try {
    await query(
      `INSERT INTO notifications
        (user_id, type, title, message, action_url, priority, category, related_user_id)
       VALUES ($1, 'parent_link_response', $2, $3, '/academy/parent/children', 'normal', 'system', $4)`,
      [link.parent_id, title, message, me]
    )
  } catch (e) {
    console.warn('[student/family] notification insert failed (non-fatal):', e)
  }

  const successMessage =
    action === 'approve' ? 'تم قبول الطلب بنجاح' : action === 'reject' ? 'تم رفض الطلب' : 'تم إلغاء الربط بنجاح'

  return NextResponse.json({ success: true, status: newStatus, message: successMessage })
}
