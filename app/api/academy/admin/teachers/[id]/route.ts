import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    const body = await req.json()
    const { name, email, gender, is_active, reapply_blocked, approval_status } = body

    const VALID_STATUSES = ['pending_approval', 'approved', 'rejected']

    // Build SET clauses dynamically so we only touch fields that were sent
    const setClauses: string[] = []
    const params: unknown[] = []
    let idx = 1

    if (name) { setClauses.push(`name = $${idx++}`); params.push(name) }
    if (email) { setClauses.push(`email = $${idx++}`); params.push(email.toLowerCase().trim()) }
    if (gender) { setClauses.push(`gender = $${idx++}`); params.push(gender) }
    if (typeof is_active === 'boolean') { setClauses.push(`is_active = $${idx++}`); params.push(is_active) }
    if (typeof reapply_blocked === 'boolean') { setClauses.push(`reapply_blocked = $${idx++}`); params.push(reapply_blocked) }
    if (approval_status && VALID_STATUSES.includes(approval_status)) {
      setClauses.push(`approval_status = $${idx++}`); params.push(approval_status)
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات للتحديث' }, { status: 400 })
    }

    setClauses.push(`updated_at = NOW()`)
    params.push(id)

    const result = await query(`
      UPDATE users SET ${setClauses.join(', ')}
      WHERE id = $${idx} AND role = 'teacher'
      RETURNING id, name, email, role, gender, is_active, reapply_blocked, approval_status, created_at
    `, params)

    if (result.length === 0) {
      return NextResponse.json({ error: 'المدرس غير موجود' }, { status: 404 })
    }
    return NextResponse.json({ data: result[0] })
  } catch (error) {
    console.error('Error updating teacher:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const adminId = session.sub

  try {
    // تحقق من وجود المدرس
    const teacher = await queryOne<{ id: string; name: string }>(
      `SELECT id, name FROM users WHERE id = $1 AND role = 'teacher'`,
      [id]
    )
    if (!teacher) {
      return NextResponse.json({ error: 'المدرس غير موجود' }, { status: 404 })
    }

    // ========================================================
    // 1) أرشفة الكورسات المرتبطة بالمدرس تلقائياً
    // ========================================================
    const archivedCourses = await query<{ id: string }>(
      `UPDATE courses
         SET is_active = false,
             archived_at = NOW(),
             archived_by = $1,
             archive_reason = 'teacher_deleted',
             original_teacher_id = teacher_id,
             teacher_id = NULL
       WHERE teacher_id = $2
         AND (is_active = true OR archived_at IS NULL)
       RETURNING id`,
      [adminId, id]
    )

    // ========================================================
    // 2) أرشفة الحلقات المرتبطة بالمدرس تلقائياً
    // ========================================================
    const archivedHalaqat = await query<{ id: string }>(
      `UPDATE halaqat
         SET is_active = false,
             archived_at = NOW(),
             archived_by = $1,
             archive_reason = 'teacher_deleted',
             original_teacher_id = teacher_id,
             teacher_id = NULL
       WHERE teacher_id = $2
         AND (is_active = true OR archived_at IS NULL)
       RETURNING id`,
      [adminId, id]
    )

    // ========================================================
    // 3) فك ارتباط الطلاب عن الحلقات قبل الحذف
    // ========================================================
    await query(
      `UPDATE users SET halaqah_id = NULL
       WHERE halaqah_id IN (
         SELECT id FROM halaqat WHERE original_teacher_id = $1
       )`,
      [id]
    )

    // ========================================================
    // 4) حذف المدرس من جدول المستخدمين
    // ========================================================
    await query(`DELETE FROM users WHERE id = $1 AND role = 'teacher'`, [id])

    return NextResponse.json({
      success: true,
      archived: {
        courses: archivedCourses.length,
        halaqat: archivedHalaqat.length,
      },
      message:
        archivedCourses.length > 0 || archivedHalaqat.length > 0
          ? `تم حذف المدرس وأرشفة ${archivedCourses.length} كورس و ${archivedHalaqat.length} حلقة تلقائياً`
          : 'تم حذف المدرس بنجاح',
    })
  } catch (error: any) {
    console.error('Error deleting teacher:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
