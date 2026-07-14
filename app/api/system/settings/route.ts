import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"
import { clearSettingCache } from "@/lib/settings"

/**
 * System Settings API (Super Admin Only)
 * 
 * GET: Retrieve all system_* settings (general, maintenance, security, email, branding, contact, homepage)
 * PUT: Update system_* settings
 * 
 * NEVER returns academy_* or maqraah_* keys
 */

// Validate setting key belongs to system namespace
function validateSystemKey(key: string): boolean {
  const systemPrefixes = [
    "system_general_",
    "system_maintenance_",
    "system_security_",
    "system_email_",
    "system_branding_",
    "system_contact_",
    "system_homepage_",
  ]
  return systemPrefixes.some((prefix) => key.startsWith(prefix))
}

export async function GET() {
  const session = await getSession()
  if (!session || !requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const settings = await query(
      `SELECT setting_key, setting_value, setting_type, updated_at, u.name AS modified_by
       FROM system_settings s
       LEFT JOIN users u ON u.id = s.updated_by
       WHERE s.setting_key LIKE 'system_%'
       ORDER BY s.setting_type, s.setting_key`
    )

    const grouped = settings.reduce(
      (acc: Record<string, any>, row: any) => {
        const type = row.setting_type
        if (!acc[type]) acc[type] = []
        acc[type].push(row)
        return acc
      },
      {}
    )

    return NextResponse.json({ settings, grouped })
  } catch (error) {
    console.error("[API] system/settings GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch system settings" },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session || !requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const settings = body?.settings

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    const rejectedKeys: string[] = []

    for (const [key, value] of Object.entries(settings)) {
      // Only allow system_* keys
      if (!validateSystemKey(key)) {
        rejectedKeys.push(key)
        continue
      }

      // Extract setting type from key (e.g., system_general_xxx → system_general)
      const typeParts = key.split("_").slice(0, 2)
      const settingType = typeParts.join("_")

      await query(
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by, updated_at)
         VALUES ($1, $2::jsonb, $3, $4, NOW())
         ON CONFLICT (setting_key) DO UPDATE
            SET setting_value = EXCLUDED.setting_value,
                setting_type = EXCLUDED.setting_type,
                updated_by = EXCLUDED.updated_by,
                updated_at = NOW()`,
        [key, JSON.stringify(value), settingType, session.sub]
      )
      clearSettingCache(key)
    }

    if (rejectedKeys.length > 0) {
      return NextResponse.json({
        success: true,
        warning: "Some keys were rejected (not system_*)",
        rejectedKeys,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] system/settings PUT error:", error)
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    )
  }
}
