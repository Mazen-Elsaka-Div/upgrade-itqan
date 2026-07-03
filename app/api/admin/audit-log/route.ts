import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

/**
 * GET /api/admin/audit-log
 * Returns governance audit log entries — super_admin only.
 * Query params: platform, action, actor_id, from, to, limit, offset
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  const isSuperAdmin = session?.role === 'admin' || session?.role === 'super_admin'
  if (!session || !isSuperAdmin) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const platform = searchParams.get('platform')
  const action   = searchParams.get('action')
  const actorId  = searchParams.get('actor_id')
  const from     = searchParams.get('from')
  const to       = searchParams.get('to')
  const limit    = Math.min(parseInt(searchParams.get('limit')  || '50'), 200)
  const offset   = parseInt(searchParams.get('offset') || '0')

  const conditions: string[] = []
  const params: unknown[]    = []
  let idx = 1

  if (platform) { conditions.push(`al.platform = $${idx++}`);              params.push(platform) }
  if (action)   { conditions.push(`al.action ILIKE $${idx++}`);            params.push(`%${action}%`) }
  if (actorId)  { conditions.push(`al.actor_id = $${idx++}`);              params.push(actorId) }
  if (from)     { conditions.push(`al.created_at >= $${idx++}`);           params.push(from) }
  if (to)       { conditions.push(`al.created_at <= $${idx++}`);           params.push(to + 'T23:59:59Z') }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''

  try {
    const [logs, countResult, platforms, actions] = await Promise.all([
      query(
        `SELECT
           al.id, al.action, al.platform,
           al.entity_type, al.entity_id,
           al.old_value, al.new_value,
           al.ip_address, al.user_agent,
           al.created_at,
           al.actor_email,
           u.name  AS actor_name,
           u.email AS actor_email_resolved
         FROM audit_log al
         LEFT JOIN users u ON u.id = al.actor_id
         ${where}
         ORDER BY al.created_at DESC
         LIMIT $${idx++} OFFSET $${idx++}`,
        [...params, limit, offset]
      ),
      query(
        `SELECT COUNT(*) AS total FROM audit_log al ${where}`,
        params
      ),
      query(`SELECT DISTINCT platform FROM audit_log ORDER BY platform`),
      query(`SELECT DISTINCT action   FROM audit_log ORDER BY action`),
    ])

    return NextResponse.json({
      logs,
      total:     parseInt((countResult[0] as { total: string })?.total || '0'),
      platforms: (platforms as { platform: string }[]).map(r => r.platform),
      actions:   (actions   as { action:   string }[]).map(r => r.action),
    })
  } catch (error) {
    console.error('[API] audit-log GET error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

/**
 * POST /api/admin/audit-log
 * Internal endpoint — write an audit entry programmatically.
 * Prefer using lib/admin/audit.ts#logAudit() from server code directly.
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  const isSuperAdmin = session?.role === 'admin' || session?.role === 'super_admin'
  if (!session || !isSuperAdmin) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const { action, platform, entity_type, entity_id, old_value, new_value } = body

  if (!action || !platform) {
    return NextResponse.json({ error: 'action و platform مطلوبان' }, { status: 400 })
  }

  try {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') ?? null

    await query(
      `INSERT INTO audit_log
         (actor_id, actor_email, action, platform, entity_type, entity_id, old_value, new_value, ip_address)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        session.sub,
        session.email ?? null,
        action,
        platform,
        entity_type ?? null,
        entity_id ?? null,
        old_value ? JSON.stringify(old_value) : null,
        new_value ? JSON.stringify(new_value) : null,
        ip,
      ]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] audit-log POST error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
