import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { assertTeacherAssignable } from '@/lib/teachers'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    const body = await req.json()

    if (body.teacher_id) {
      // Reject assignment to pending / rejected / suspended teachers.
      const teacherCheck = await assertTeacherAssignable(body.teacher_id)
      if (!teacherCheck.ok) {
        return NextResponse.json({ error: teacherCheck.message }, { status: 400 })
      }
    }

    const result = await query(`
      UPDATE halaqat SET name = COALESCE($1, name), description = COALESCE($2, description),
        teacher_id = COALESCE($3, teacher_id), gender = COALESCE($4, gender),
        max_students = COALESCE($5, max_students), meeting_link = COALESCE($6, meeting_link),
        updated_at = NOW() WHERE id = $7 RETURNING *
    `, [body.name || null, body.description || null, body.teacher_id || null, body.gender || null, body.max_students || null, body.meeting_link || null, id])
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Halaqah not found' }, { status: 404 })
    }
    return NextResponse.json({ data: result[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    await query(`DELETE FROM halaqat WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
