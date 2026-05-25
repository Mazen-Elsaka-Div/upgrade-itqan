import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

// GET /api/library/books?search=&category=&language=
// Public to any authenticated user; only returns published books.
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const searchParams = new URL(req.url).searchParams
    const search = (searchParams.get("search") || "").trim()
    const category = (searchParams.get("category") || "").trim()
    const language = (searchParams.get("language") || "").trim()
    const domain = (searchParams.get("domain") || "maqraa").trim()

    const conditions: string[] = ["b.is_published = TRUE"]
    const params: any[] = []

    // Domain filter
    params.push(domain)
    conditions.push(`b.library_domain = $${params.length}`)

    if (search) {
      params.push(`%${search}%`)
      conditions.push(`(b.title ILIKE $${params.length} OR b.author ILIKE $${params.length})`)
    }
    if (category) {
      // Accept either UUID (category_id) or slug for backward compat.
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category)
      params.push(category)
      conditions.push(
        isUuid
          ? `b.category_id = $${params.length}`
          : `(b.category = $${params.length} OR EXISTS (SELECT 1 FROM categories c WHERE c.id = b.category_id AND c.slug = $${params.length}))`
      )
    }
    if (language) {
      params.push(language)
      conditions.push(
        `EXISTS (SELECT 1 FROM book_files bf2 WHERE bf2.book_id = b.id AND bf2.language = $${params.length})`
      )
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""

    const books = await query<{
      id: string
      title: string
      author: string | null
      description: string | null
      cover_image_url: string | null
      pages_count: number | null
      publish_date: string | null
      category: string | null
      category_id: string | null
      category_name: string | null
      category_slug: string | null
      languages: { language: string; language_label: string | null }[]
      created_at: string
    }>(
      `
      SELECT
        b.id, b.title, b.author, b.description, b.cover_image_url,
        b.pages_count, b.publish_date, b.category, b.category_id,
        c.name AS category_name, c.slug AS category_slug,
        b.created_at,
        COALESCE(
          (
            SELECT json_agg(json_build_object(
              'language', bf.language,
              'language_label', bf.language_label
            ) ORDER BY bf.created_at)
            FROM book_files bf WHERE bf.book_id = b.id
          ),
          '[]'::json
        ) AS languages
      FROM books b
      LEFT JOIN categories c ON c.id = b.category_id
      ${whereClause}
      ORDER BY b.display_order ASC, b.created_at DESC
      `,
      params
    )

    return NextResponse.json({ books })
  } catch (error) {
    console.error("[library] list error:", error)
    return NextResponse.json({ error: "حدث خطأ في جلب الكتب" }, { status: 500 })
  }
}
