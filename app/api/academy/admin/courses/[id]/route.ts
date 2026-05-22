import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Columns the admin is allowed to update on a course.
// IMPORTANT: only columns that actually exist on the `courses` table.
const STRING_FIELDS = ['title', 'description', 'thumbnail_url', 'specialization'] as const
const UUID_FIELDS = ['category_id', 'teacher_id'] as const
const ENUM_FIELDS: Record<string, readonly string[]> = {
  status: ['draft', 'pending_review', 'published', 'archived', 'rejected'],
  level: ['beginner', 'intermediate', 'advanced'],
}
const BOOL_FIELDS = ['is_active', 'is_published', 'is_public'] as const

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid course id' }, { status: 400 })
  }

  let body: Record<string, any>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const sets: string[] = []
  const values: any[] = []

  const push = (column: string, value: any) => {
    values.push(value)
    sets.push(`${column} = $${values.length}`)
  }

  for (const field of STRING_FIELDS) {
    if (field in body) {
      const v = body[field]
      if (v === null || v === '') {
        push(field, null)
      } else if (typeof v === 'string') {
        push(field, v.trim())
      }
    }
  }

  for (const field of UUID_FIELDS) {
    if (field in body) {
      const v = body[field]
      if (v === null || v === '' || v === undefined) {
        push(field, null)
      } else if (typeof v === 'string' && UUID_RE.test(v)) {
        push(field, v)
      } else {
        return NextResponse.json({ error: `Invalid ${field}` }, { status: 400 })
      }
    }
  }

  for (const [field, allowed] of Object.entries(ENUM_FIELDS)) {
    if (field in body) {
      const v = body[field]
      if (v === null || v === '' || v === undefined) continue
      if (typeof v === 'string' && allowed.includes(v)) {
        push(field, v)
      } else {
        return NextResponse.json({ error: `Invalid ${field}` }, { status: 400 })
      }
    }
  }

  for (const field of BOOL_FIELDS) {
    if (field in body) {
      const v = body[field]
      if (typeof v === 'boolean') push(field, v)
    }
  }

  // Keep is_published in sync when status changes
  if ('status' in body && body.status && !('is_published' in body)) {
    push('is_published', body.status === 'published')
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  sets.push(`updated_at = NOW()`)
  values.push(id)

  const sql = `UPDATE courses SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`

  try {
    const result = await query<any>(sql, values)
    if (!result || result.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    return NextResponse.json({ data: result[0] })
  } catch (error: any) {
    console.error('[API] Admin course PATCH error:', error)
    const detail = process.env.NODE_ENV !== 'production' ? (error?.message || String(error)) : undefined
    return NextResponse.json({ error: 'Internal server error', detail }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid course id' }, { status: 400 })
  }
  try {
    const enrolled = await query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM enrollments WHERE course_id = $1`,
      [id]
    )
    const force = req.nextUrl.searchParams.get('force') === '1'
    if (!force && enrolled[0]?.count > 0) {
      return NextResponse.json(
        {
          error: 'Course has enrollments',
          enrolled_count: enrolled[0].count,
          message: 'يوجد طلاب مسجلين في هذه الدورة. استخدم ?force=1 للحذف على أي حال.',
        },
        { status: 409 }
      )
    }
    await query(`DELETE FROM courses WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API] Admin course DELETE error:', error)
    const detail = process.env.NODE_ENV !== 'production' ? (error?.message || String(error)) : undefined
    return NextResponse.json({ error: 'Internal server error', detail }, { status: 500 })
  }
}
