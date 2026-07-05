import { NextRequest, NextResponse } from "next/server"
import { getSession, isSuperAdmin } from "@/lib/auth"
import { query } from "@/lib/db"
import { DEFAULT_THEME, normalizeTheme } from "@/lib/admin/theme"

/**
 * GET /api/admin/settings/full-export
 *
 * Returns a comprehensive JSON snapshot of ALL configurable settings:
 *   - site_* (site-settings)
 *   - theme_config
 *   - maqraah_* + system keys (app_url, smtp_config, branding, contact_info, etc.)
 *   - seo settings
 *   - homepage settings
 *
 * Sensitive fields (smtp password) are masked.
 * Only accessible by super-admins.
 *
 * Query param: ?includeTheme=true to include theme_config in the export.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !isSuperAdmin(session)) {
    return NextResponse.json({ error: "غير مصرح — يتطلب صلاحيات المدير العام" }, { status: 403 })
  }

  const includeTheme = req.nextUrl.searchParams.get("includeTheme") === "true"

  try {
    // Fetch ALL settings from system_settings in one query
    const rows = await query<{ setting_key: string; setting_value: any; setting_type: string; updated_at: string }>(
      `SELECT setting_key, setting_value, setting_type, updated_at
         FROM system_settings
        ORDER BY setting_key`
    )

    // Categorise settings by their key prefix/type
    const siteSettings: Record<string, any> = {}
    const maqraaSettings: Record<string, any> = {}
    const seoSettings: Record<string, any> = {}
    const homepageSettings: Record<string, any> = {}
    const generalSettings: Record<string, any> = {}
    let rawTheme: any = null

    for (const row of rows) {
      const { setting_key: key, setting_value: value, setting_type: type } = row

      // Skip theme — handled separately below based on includeTheme param
      if (key === "theme_config") {
        rawTheme = value
        continue
      }

      // Site settings (managed by site-settings form)
      if (key.startsWith("site_")) {
        siteSettings[key] = value
        continue
      }

      // Maqraa-specific settings
      if (key.startsWith("maqraah_")) {
        maqraaSettings[key] = value
        continue
      }

      // SEO settings
      if (type === "seo") {
        seoSettings[key] = value
        continue
      }

      // Homepage settings
      if (type === "homepage") {
        homepageSettings[key] = value
        continue
      }

      // All remaining: branding, contact_info, smtp_config (masked), app_url, etc.
      let safeValue = value
      if (key === "smtp_config" && value && typeof value === "object") {
        safeValue = { ...value }
        if (safeValue.password) safeValue.password = "********" // Mask password
      }
      generalSettings[key] = safeValue
    }

    const exportPayload: Record<string, any> = {
      exported_at: new Date().toISOString(),
      exported_by: session.sub,
      version: "2.0",
      includes_theme: includeTheme,
      site_settings: siteSettings,
      maqraa_settings: maqraaSettings,
      seo_settings: seoSettings,
      homepage_settings: homepageSettings,
      general_settings: generalSettings,
    }

    if (includeTheme) {
      exportPayload.theme = rawTheme ? normalizeTheme(rawTheme) : DEFAULT_THEME
    }

    const suffix = includeTheme ? "with-theme" : "settings-only"
    const filename = `itqan-full-backup-${suffix}-${new Date().toISOString().split("T")[0]}.json`

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error("[FullExport] Error:", error)
    return NextResponse.json(
      { error: "فشل في تصدير الإعدادات", details: error?.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/settings/full-export
 *
 * Restores settings from a previously exported JSON snapshot.
 * Body: { data: <exported JSON object> }
 *
 * - Restores: site_settings, maqraa_settings, seo_settings, homepage_settings, general_settings
 * - Restores theme ONLY if data.includes_theme === true and data.theme exists
 * - smtp_config: skips restore if password is masked (keeps existing)
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !isSuperAdmin(session)) {
    return NextResponse.json({ error: "غير مصرح — يتطلب صلاحيات المدير العام" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const data = body?.data

    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "بيانات غير صالحة — الملف لا يحتوي على بيانات صحيحة" }, { status: 400 })
    }

    const restored: string[] = []
    const skipped: string[] = []

    // Helper: upsert a single key
    const upsert = async (key: string, value: any, type: string) => {
      await query(
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by, updated_at)
         VALUES ($1, $2::jsonb, $3, $4, NOW())
         ON CONFLICT (setting_key) DO UPDATE
            SET setting_value = EXCLUDED.setting_value,
                setting_type  = EXCLUDED.setting_type,
                updated_by    = EXCLUDED.updated_by,
                updated_at    = NOW()`,
        [key, JSON.stringify(value), type, session.sub]
      )
      restored.push(key)
    }

    // ── Restore site settings
    if (data.site_settings && typeof data.site_settings === "object") {
      for (const [key, value] of Object.entries(data.site_settings)) {
        if (key.startsWith("site_")) await upsert(key, value, "site")
      }
    }

    // ── Restore maqraa settings
    if (data.maqraa_settings && typeof data.maqraa_settings === "object") {
      for (const [key, value] of Object.entries(data.maqraa_settings)) {
        if (key.startsWith("maqraah_")) await upsert(key, value, "general")
      }
    }

    // ── Restore SEO settings
    if (data.seo_settings && typeof data.seo_settings === "object") {
      for (const [key, value] of Object.entries(data.seo_settings)) {
        await upsert(key, value, "seo")
      }
    }

    // ── Restore homepage settings
    if (data.homepage_settings && typeof data.homepage_settings === "object") {
      for (const [key, value] of Object.entries(data.homepage_settings)) {
        await upsert(key, value, "homepage")
      }
    }

    // ── Restore general settings (branding, contact_info, app_url, etc.)
    if (data.general_settings && typeof data.general_settings === "object") {
      for (const [key, value] of Object.entries(data.general_settings)) {
        // Skip smtp if password is masked
        if (key === "smtp_config" && (value as any)?.password === "********") {
          skipped.push(`${key} (password masked — not restored)`)
          continue
        }
        await upsert(key, value, "general")
      }
    }

    // ── Restore theme (only if file was exported with theme)
    if (data.includes_theme && data.theme && typeof data.theme === "object") {
      const normalised = normalizeTheme(data.theme)
      await query(
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public, updated_by, updated_at)
         VALUES ('theme_config', $1::jsonb, 'general', 'Global design tokens', true, $2, NOW())
         ON CONFLICT (setting_key) DO UPDATE
            SET setting_value = EXCLUDED.setting_value,
                updated_by    = EXCLUDED.updated_by,
                updated_at    = NOW()`,
        [JSON.stringify(normalised), session.sub]
      )
      restored.push("theme_config")
    }

    // Log
    await query(
      `INSERT INTO activity_logs (user_id, action, description) VALUES ($1, 'settings_restored', $2)`,
      [session.sub, `Full settings restored from backup. Keys: ${restored.length}. Skipped: ${skipped.length}`]
    )

    return NextResponse.json({
      ok: true,
      restored: restored.length,
      skipped,
      message: `تم استعادة ${restored.length} إعداد بنجاح${skipped.length > 0 ? ` (تم تخطي ${skipped.length})` : ""}`,
    })
  } catch (error: any) {
    console.error("[FullRestore] Error:", error)
    return NextResponse.json({ error: "فشل في استعادة الإعدادات", details: error?.message }, { status: 500 })
  }
}
