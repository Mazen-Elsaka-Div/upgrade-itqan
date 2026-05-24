import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session || !['admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const fields = await query(
      `SELECT * FROM fiqh_form_fields ORDER BY sort_order ASC, created_at ASC`
    )
    return NextResponse.json({ fields })
  } catch (error) {
    console.error('[API] GET fiqh_form_fields error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !['admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, label_ar, type, options, is_required, sort_order, is_active } = body

    if (!name || !label_ar) {
      return NextResponse.json({ error: 'Name and label are required' }, { status: 400 })
    }

    const inserted = await query(
      `INSERT INTO fiqh_form_fields 
        (name, label_ar, type, options, is_required, sort_order, is_active)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7)
       RETURNING *`,
      [
        name,
        label_ar,
        type || 'text',
        options ? JSON.stringify(options) : null,
        is_required ?? false,
        sort_order ?? 0,
        is_active ?? true,
      ]
    )

    return NextResponse.json({ field: inserted[0] }, { status: 201 })
  } catch (error: any) {
    console.error('[API] POST fiqh_form_fields error:', error)
    if (error.code === '23505') {
      // unique violation
      return NextResponse.json({ error: 'حقل بهذا الاسم موجود مسبقاً' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
