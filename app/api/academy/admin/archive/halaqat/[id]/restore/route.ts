import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

/**
 * PATCH /api/academy/admin/archive/halaqat/[id]/restore
 * Body: { teacher_id?: string }  — المدرس الجديد (اختياري)
 *
 * يستعيد حلقة من الأرشيف ويمكن تعيين مدرس جديد لها.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let body: { teacher_id?: string | null } = {}
  try { body = await req.json() } catch { /* no body is fine */ }

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  // التحقق من أن الحلقة موجودة ومؤرشفة
  const halaqah = await queryOne<{ id: string; name: string }>(
    `SELECT id, name FROM halaqat WHERE id = $1 AND is_active = FALSE AND archived_at IS NOT NULL`,
    [id]
  )
  if (!halaqah) {
    return NextResponse.json(
      { error: 'الحلقة غير موجودة أو غير مؤرشفة' },
      { status: 404 }
    )
  }

  // التحقق من صحة teacher_id إذا أُرسل
  if (body.teacher_id && !UUID_RE.test(body.teacher_id)) {
    return NextResponse.json({ error: 'teacher_id غير صالح' }, { status: 400 })
  }

  try {
    const sets: string[] = [
      'is_active = true',
      'archived_at = NULL',
      'archived_by = NULL',
      'archive_reason = NULL',
    ]
    const values: any[] = []

    if (body.teacher_id) {
      values.push(body.teacher_id)
      sets.push(`teacher_id = $${values.length}`)
    }

    sets.push('updated_at = NOW()')
    values.push(id)

    const result = await query<any>(
      `UPDATE halaqat SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING id, name, teacher_id`,
      values
    )

    return NextResponse.json({
      success: true,
      data: result[0],
      message: `تم استعادة الحلقة "${halaqah.name}" من الأرشيف`,
    })
  } catch (error) {
    console.error('[API] restore halaqah error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
