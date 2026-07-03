import { query } from '@/lib/db'
import { headers } from 'next/headers'

export type AuditPlatform = 'maqraa' | 'academy' | 'site'

export interface AuditEntry {
  actor_id?: string
  actor_email?: string
  action: string
  platform: AuditPlatform
  entity_type?: string
  entity_id?: string
  old_value?: Record<string, unknown>
  new_value?: Record<string, unknown>
}

/**
 * logAudit — تسجيل حدث حساس في جدول audit_log.
 * يُستدعى من Server Actions أو Route Handlers فقط.
 * لا يرمي exception لو فشل التسجيل (non-blocking).
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const headersList = await headers()
    const forwarded = headersList.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : headersList.get('x-real-ip') ?? null
    const userAgent = headersList.get('user-agent') ?? null

    await query(
      `INSERT INTO audit_log
         (actor_id, actor_email, action, platform, entity_type, entity_id, old_value, new_value, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        entry.actor_id ?? null,
        entry.actor_email ?? null,
        entry.action,
        entry.platform,
        entry.entity_type ?? null,
        entry.entity_id ?? null,
        entry.old_value ? JSON.stringify(entry.old_value) : null,
        entry.new_value ? JSON.stringify(entry.new_value) : null,
        ip,
        userAgent,
      ]
    )
  } catch (err) {
    // Non-blocking — log error only in dev
    console.error('[audit] failed to write audit entry:', err)
  }
}
