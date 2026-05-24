import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !['admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

  try {
    const body = await req.json()
    const sets: string[] = []
    const values: any[] = []
    let i = 1

    if (body.name !== undefined) { sets.push(`name = $${i++}`); values.push(body.name) }
    if (body.label_ar !== undefined) { sets.push(`label_ar = $${i++}`); values.push(body.label_ar) }
    if (body.type !== undefined) { sets.push(`type = $${i++}`); values.push(body.type) }
    if (body.options !== undefined) { sets.push(`options = $${i++}::jsonb`); values.push(body.options ? JSON.stringify(body.options) : null) }
    if (body.is_required !== undefined) { sets.push(`is_required = $${i++}`); values.push(body.is_required) }
    if (body.sort_order !== undefined) { sets.push(`sort_order = $${i++}`); values.push(body.sort_order) }
    if (body.is_active !== undefined) { sets.push(`is_active = $${i++}`); values.push(body.is_active) }

    if (sets.length === 0) return NextResponse.json({ ok: true })

    sets.push(`updated_at = NOW()`)
    values.push(id)

    const updated = await query(
      `UPDATE fiqh_form_fields SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    )

    if (!updated.length) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 })
    }

    return NextResponse.json({ field: updated[0] })
  } catch (error: any) {
    console.error('[API] PATCH fiqh_form_fields error:', error)
    if (error.code === '23505') {
      return NextResponse.json({ error: 'حقل بهذا الاسم موجود مسبقاً' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !['admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

  try {
    const deleted = await queryOne(`DELETE FROM fiqh_form_fields WHERE id = $1 RETURNING id`, [id])
    if (!deleted) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[API] DELETE fiqh_form_fields error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
