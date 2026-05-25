import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

/**
 * GET /api/library/categories
 * Returns the children of the root "book" category, used by both the public
 * library filter and the admin book form. Available to any authenticated user.
 */
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const rows = await query<{
      id: string
      name: string
      slug: string
      color: string | null
      icon: string | null
      display_order: number
    }>(
      `SELECT c.id, c.name, c.slug, c.color, c.icon, c.display_order
         FROM categories c
         JOIN categories root ON root.id = c.parent_id AND root.slug = 'book'
        WHERE c.is_active = TRUE
        ORDER BY c.display_order ASC, c.name ASC`
    )
    return NextResponse.json({ categories: rows })
  } catch (error) {
    console.error("[library/categories]", error)
    return NextResponse.json({ categories: [] })
  }
}
