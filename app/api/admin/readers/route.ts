import { NextRequest, NextResponse } from 'next/server'
import { getSession, requireRole } from '@/lib/auth'
import { query } from '@/lib/db'
import { resolveSupervisorScope, canSupervisorAccessUser } from '@/lib/supervisor-scope'

export async function GET(req: NextRequest) {
    const session = await getSession()
    const allowedRoles: ("admin" | "reciter_supervisor")[] = ["admin", "reciter_supervisor"]
    if (!requireRole(session, allowedRoles)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const gender = searchParams.get('gender') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 20
    const offset = (page - 1) * limit

    let conditions: string[] = [`u.role = 'reader'`]
    let params: any[] = []
    let idx = 1

    if (search) {
        conditions.push(`(u.name ILIKE $${idx} OR u.email ILIKE $${idx})`)
        params.push(`%${search}%`)
        idx++
    }
    if (status) { conditions.push(`u.approval_status = $${idx++}`); params.push(status) }
    if (gender) { conditions.push(`u.gender = $${idx++}`); params.push(gender) }

    // Scoped permissions: reciter_supervisor with assignments sees only assigned readers.
    if (session!.role === 'reciter_supervisor') {
        const scope = await resolveSupervisorScope(session!)
        if (scope.kind === 'ids') {
            conditions.push(`u.id = ANY($${idx++}::uuid[])`)
            params.push(scope.ids)
        }
    }

    const where = 'WHERE ' + conditions.join(' AND ')

    const q = `
    SELECT
      u.id, u.name, u.email, u.phone, u.is_active, u.created_at,
      u.approval_status, u.gender, u.city, u.is_accepting_recitations,
      u.full_name_triple, u.qualification, u.memorized_parts, u.years_of_experience,
      rp.rating, rp.total_reviews, rp.total_sessions_completed, rp.is_accepting_students,
      rp.availability_mode, rp.max_total_slots, rp.current_reserved_slots,
      rsta.total_reviews_completed, rsta.total_sessions_completed AS sessions_done,
      rsta.total_sessions_booked,
      rsta.average_session_rating, rsta.last_review_at,
      (SELECT COUNT(*) FROM recitations r WHERE r.assigned_reader_id = u.id AND r.status = 'needs_session') as waiting_sessions_count,
      (SELECT COUNT(*) FROM recitations r WHERE r.assigned_reader_id = u.id AND r.status IN ('pending', 'in_review')) as pending_reviews_count
    FROM users u
    LEFT JOIN reader_profiles rp ON u.id = rp.user_id
    LEFT JOIN reader_stats rsta ON u.id = rsta.reader_id
    ${where}
    ORDER BY u.created_at DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `
    params.push(limit, offset)

    const countQuery = `SELECT COUNT(*) AS total FROM users u ${where}`

    const [readers, countResult] = await Promise.all([
        query(q, params),
        query(countQuery, params.slice(0, -2)),
    ])

    return NextResponse.json({
        readers,
        total: parseInt((countResult[0] as any)?.total || '0'),
        page,
        limit,
    })
}

export async function PATCH(req: NextRequest) {
    const session = await getSession()
    const allowedRoles: ("admin" | "reciter_supervisor")[] = ["admin", "reciter_supervisor"]
    if (!requireRole(session, allowedRoles)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, ...fields } = body
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    // Scoped permissions: reciter_supervisor can only edit assigned readers.
    if (session!.role === 'reciter_supervisor') {
        const allowedTarget = await canSupervisorAccessUser(session!, id)
        if (!allowedTarget) {
            return NextResponse.json({ error: 'هذا المقرئ خارج نطاق إشرافك' }, { status: 403 })
        }
    }

    const allowed = [
      'name', 'phone', 'city', 'gender', 'qualification', 'memorized_parts', 
      'years_of_experience', 'is_active', 'is_accepting_recitations',
      'availability_mode', 'max_total_slots', 'is_accepting_students'
    ]
    const setters: string[] = []
    const params: any[] = []
    let idx = 1

    for (const [k, v] of Object.entries(fields)) {
        if (allowed.includes(k)) {
            if (['availability_mode', 'max_total_slots', 'is_accepting_students'].includes(k)) {
                // These are on reader_profiles
                await query(`UPDATE reader_profiles SET ${k} = $1 WHERE user_id = $2`, [v, id]);
            } else {
                setters.push(`${k} = $${idx++}`); params.push(v)
            }
        }
    }

    if (!setters.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

    setters.push(`updated_at = NOW()`)
    params.push(id)

    await query(`UPDATE users SET ${setters.join(', ')} WHERE id = $${idx} AND role = 'reader'`, params)

    return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
    const session = await getSession()
    if (!requireRole(session, ["admin"])) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    // Check for active bookings
    const bookings = await query(
        `SELECT id FROM bookings WHERE reader_id = $1 AND status IN ('pending', 'confirmed')`,
        [id]
    )
    if (bookings.length > 0) {
        return NextResponse.json({ 
            error: 'لا يمكن حذف المقرئ لوجود جلسات مجدولة نشطة. يرجى إلغاء الجلسات أو تحويل الطلاب أولاً.' 
        }, { status: 400 })
    }

    await query(`DELETE FROM users WHERE id = $1 AND role = 'reader'`, [id])
    return NextResponse.json({ ok: true })
}
