import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

function isSuperAdmin(session: any): boolean {
  return session?.role === "admin" || session?.role === "super_admin"
}

// GET /api/admin/content-pages — list all pages
export async function GET() {
  const session = await getSession()
  if (!session || !isSuperAdmin(session)) {
    return NextResponse.json({ error: "مخصص للمدير العام فقط" }, { status: 403 })
  }

  try {
    const rows = await query<{
      id: string
      slug: string
      title_ar: string
      title_en: string
      is_published: boolean
      updated_at: string
      updated_by_name: string | null
    }>(
      `SELECT
         cp.id,
         cp.slug,
         cp.title_ar,
         cp.title_en,
         cp.is_published,
         cp.updated_at,
         u.name AS updated_by_name
       FROM content_pages cp
       LEFT JOIN users u ON u.id = cp.updated_by
       ORDER BY cp.slug ASC`
    )

    return NextResponse.json({ pages: rows })
  } catch (error) {
    console.error("[ContentPages] GET error:", error)
    return NextResponse.json({ error: "فشل في جلب الصفحات" }, { status: 500 })
  }
}
