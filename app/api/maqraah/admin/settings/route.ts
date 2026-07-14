import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth"

/**
 * Maqraah Settings API (Maqraah Admin Only)
 *
 * GET: Retrieve all maqraah_* settings (halaqat, readers, recitations, paths, points, competitions, notifications, etc.)
 * PUT: Update maqraah_* settings
 *
 * NEVER returns system_* or academy_* keys
 * Does NOT include general/security/maintenance (those are system-wide)
 */

export async function GET(request: NextRequest) {
  try {
    // Maqraah Admin role check (NOT academy_admin or super_admin)
    const user = await requireRole("maqraa_admin")

    const client = await createClient()

    // Fetch ONLY maqraah_* settings (prefixed with 'maqraah_')
    const { data: settings, error } = await client
      .from("system_settings")
      .select("*")
      .like("setting_key", "maqraah_%")
      .order("setting_type", { ascending: true })
      .order("setting_key", { ascending: true })

    if (error) {
      console.error("[API] maqraah/admin/settings GET error:", error)
      return NextResponse.json(
        { error: "Failed to fetch maqraah settings" },
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
    console.error("[API] maqraah/admin/settings GET error:", error)
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.status || 403 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Maqraah Admin role check
    const user = await requireRole("maqraa_admin")

    const body = await request.json()
    const { setting_key, setting_value, setting_type, description } = body

    // Validation: key must start with maqraah_
    if (!setting_key?.startsWith("maqraah_")) {
      return NextResponse.json(
        { error: "Invalid setting key. Must start with 'maqraah_'" },
        { status: 400 }
      )
    }

    // Validation: type must start with maqraah_
    if (!setting_type?.startsWith("maqraah_")) {
      return NextResponse.json(
        { error: "Invalid setting type. Must start with 'maqraah_'" },
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
      console.error("[API] maqraah/admin/settings PUT error:", error)
      return NextResponse.json(
        { error: "Failed to update maqraah setting" },
        { status: 500 }
      )
    }

    console.log(
      `[API] Maqraah admin ${user.id} updated setting: ${setting_key}`
    )

    return NextResponse.json({ success: true, setting: data })
  } catch (error: any) {
    console.error("[API] maqraah/admin/settings PUT error:", error)
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.status || 403 }
    )
  }
}
