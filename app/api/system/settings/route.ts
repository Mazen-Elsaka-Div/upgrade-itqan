import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth"

/**
 * System Settings API (Super Admin Only)
 * 
 * GET: Retrieve all system_* settings (general, maintenance, security, email, branding, contact, homepage)
 * PUT: Update system_* settings
 * 
 * NEVER returns academy_* or maqraah_* keys
 */

export async function GET(request: NextRequest) {
  try {
    // Super Admin role check
    const user = await requireRole("super_admin")

    const client = await createClient()

    // Fetch ONLY system_* settings (prefixed with 'system_')
    const { data: settings, error } = await client
      .from("system_settings")
      .select("*")
      .like("setting_key", "system_%")
      .order("setting_type", { ascending: true })
      .order("setting_key", { ascending: true })

    if (error) {
      console.error("[API] system/settings GET error:", error)
      return NextResponse.json(
        { error: "Failed to fetch system settings" },
        { status: 500 }
      )
    }

    // Group by type for convenience
    const grouped = settings.reduce(
      (acc, setting) => {
        const type = setting.setting_type
        if (!acc[type]) acc[type] = []
        acc[type].push(setting)
        return acc
      },
      {} as Record<string, typeof settings>
    )

    return NextResponse.json({ settings, grouped })
  } catch (error: any) {
    console.error("[API] system/settings GET error:", error)
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.status || 403 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Super Admin role check
    const user = await requireRole("super_admin")

    const body = await request.json()
    const { setting_key, setting_value, setting_type, description } = body

    // Validation: key must start with system_
    if (!setting_key?.startsWith("system_")) {
      return NextResponse.json(
        { error: "Invalid setting key. Must start with 'system_'" },
        { status: 400 }
      )
    }

    // Validation: type must start with system_
    if (!setting_type?.startsWith("system_")) {
      return NextResponse.json(
        { error: "Invalid setting type. Must start with 'system_'" },
        { status: 400 }
      )
    }

    const client = await createClient()

    const { data, error } = await client
      .from("system_settings")
      .upsert(
        {
          setting_key,
          setting_value,
          setting_type,
          description: description || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "setting_key" }
      )
      .select()
      .single()

    if (error) {
      console.error("[API] system/settings PUT error:", error)
      return NextResponse.json(
        { error: "Failed to update system setting" },
        { status: 500 }
      )
    }

    console.log(
      `[API] Super admin ${user.id} updated system setting: ${setting_key}`
    )

    return NextResponse.json({ success: true, setting: data })
  } catch (error: any) {
    console.error("[API] system/settings PUT error:", error)
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.status || 403 }
    )
  }
}
