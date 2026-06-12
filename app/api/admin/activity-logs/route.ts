import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  const allowed = ['admin', 'student_supervisor', 'reciter_supervisor']
  if (!session || !allowed.includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isSupervisor = session.role === 'student_supervisor' || session.role === 'reciter_supervisor'

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action') || ''
  const userId = searchParams.get('userId') || ''
  const dateFrom = searchParams.get('dateFrom') || ''
  const dateTo = searchParams.get('dateTo') || ''
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 50
  const offset = (page - 1) * limit

  let conditions: string[] = []
  let params: any[] = []
  let idx = 1

  // Supervisors can only ever see their own activity.
  if (isSupervisor) {
    conditions.push(`al.user_id = $${idx++}`); params.push(session.sub)
  } else if (userId) {
    conditions.push(`al.user_id = $${idx++}`); params.push(userId)
  }

  if (action) { conditions.push(`al.action = $${idx++}`); params.push(action) }
  if (dateFrom) { conditions.push(`al.created_at >= $${idx++}`); params.push(dateFrom) }
  if (dateTo) { conditions.push(`al.created_at <= $${idx++}`); params.push(dateTo + 'T23:59:59Z') }
  if (search) { conditions.push(`(al.action ILIKE $${idx} OR al.description ILIKE $${idx} OR u.name ILIKE $${idx})`); params.push(`%${search}%`); idx++ }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''

  const q = `
    SELECT
      al.id, al.action, al.entity_type, al.entity_id,
      al.description, al.status, al.ip_address,
      al.created_at,
      u.name AS user_name, u.email AS user_email, u.role AS user_role
    FROM activity_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ${where}
    ORDER BY al.created_at DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `
  params.push(limit, offset)

  const countQuery = `
    SELECT COUNT(*) AS total FROM activity_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ${where}
  `

  const [logs, countResult, actionsResult] = await Promise.all([
    query(q, params),
    query(countQuery, params.slice(0, -2)),
    query(`SELECT DISTINCT action FROM activity_logs ORDER BY action`),
  ])

  return NextResponse.json({
    logs,
    total: parseInt((countResult[0] as any)?.total || '0'),
    page,
    limit,
    actions: actionsResult.map((r: any) => r.action),
  })
}
