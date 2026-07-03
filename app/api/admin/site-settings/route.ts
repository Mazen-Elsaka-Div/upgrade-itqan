import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"
import { clearSettingCache } from "@/lib/settings"

// Keys owned by the Super Admin only — site-wide, not platform-specific.
const SITE_KEYS = [
  "site_name",
  "site_tagline",
  "site_default_language",
  "site_timezone",
  "site_maintenance_enabled",
  "site_maintenance_message",
  "site_social_links",
  "site_contact_email",
  "site_contact_phone",
] as const

type SiteKey = (typeof SITE_KEYS)[number]

function isSuperAdmin(session: any): boolean {
  return session?.role === "admin" || session?.role === "super_admin"
}

// GET /api/admin/site-settings
export async function GET() {
  const session = await getSession()
  if (!session || !isSuperAdmin(session)) {
    return NextResponse.json({ error: "مخصص للمدير العام فقط" }, { status: 403 })
  }

  try {
    const rows = await query<{ setting_key: string; setting_value: any; updated_at: string; name?: string }>(
      `SELECT s.setting_key, s.setting_value, s.updated_at, u.name
         FROM system_settings s
         LEFT JOIN users u ON u.id = s.updated_by
        WHERE s.setting_key = ANY($1::text[])
        ORDER BY s.setting_key`,
      [SITE_KEYS as unknown as string[]]
    )

    const settings: Record<string, any> = {}
    for (const row of rows) {
      settings[row.setting_key] = {
        value: row.setting_value,
        updatedAt: row.updated_at,
        modifiedBy: row.name ?? null,
      }
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("[SiteSettings] GET error:", error)
    return NextResponse.json({ error: "فشل في جلب الإعدادات" }, { status: 500 })
  }
}

// PUT /api/admin/site-settings
export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session || !isSuperAdmin(session)) {
    return NextResponse.json({ error: "مخصص للمدير العام فقط" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const incoming: Partial<Record<SiteKey, any>> = body?.settings ?? {}

    const rejected: string[] = []

    for (const [key, value] of Object.entries(incoming)) {
      if (!SITE_KEYS.includes(key as SiteKey)) {
        rejected.push(key)
        continue
      }

      await query(
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by, updated_at)
         VALUES ($1, $2::jsonb, 'site', $3, NOW())
         ON CONFLICT (setting_key) DO UPDATE
            SET setting_value = EXCLUDED.setting_value,
                setting_type  = EXCLUDED.setting_type,
                updated_by    = EXCLUDED.updated_by,
                updated_at    = NOW()`,
        [key, JSON.stringify(value), session.sub]
      )

      clearSettingCache(key)
    }

    return NextResponse.json({
      success: true,
      ...(rejected.length > 0 && { warning: "مفاتيح غير معروفة تم تجاهلها", rejected }),
    })
  } catch (error) {
    console.error("[SiteSettings] PUT error:", error)
    return NextResponse.json({ error: "فشل في حفظ الإعدادات" }, { status: 500 })
  }
}
