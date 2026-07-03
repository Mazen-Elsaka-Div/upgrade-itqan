import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

function isSuperAdmin(session: any): boolean {
  return session?.role === "admin" || session?.role === "super_admin"
}

// GET /api/admin/content-pages/[slug] — full page content
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession()
  if (!session || !isSuperAdmin(session)) {
    return NextResponse.json({ error: "مخصص للمدير العام فقط" }, { status: 403 })
  }

  const { slug } = await params

  try {
    const rows = await query<{
      id: string
      slug: string
      title_ar: string
      title_en: string
      content_ar: string
      content_en: string
      meta_desc_ar: string
      meta_desc_en: string
      is_published: boolean
      updated_at: string
    }>(
      `SELECT id, slug, title_ar, title_en, content_ar, content_en,
              meta_desc_ar, meta_desc_en, is_published, updated_at
       FROM content_pages
       WHERE slug = $1
       LIMIT 1`,
      [slug]
    )

    if (!rows.length) {
      return NextResponse.json({ error: "الصفحة غير موجودة" }, { status: 404 })
    }

    return NextResponse.json({ page: rows[0] })
  } catch (error) {
    console.error("[ContentPages] GET slug error:", error)
    return NextResponse.json({ error: "فشل في جلب الصفحة" }, { status: 500 })
  }
}

// PUT /api/admin/content-pages/[slug] — update page
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession()
  if (!session || !isSuperAdmin(session)) {
    return NextResponse.json({ error: "مخصص للمدير العام فقط" }, { status: 403 })
  }

  const { slug } = await params

  try {
    const body = await req.json()
    const {
      title_ar,
      title_en,
      content_ar,
      content_en,
      meta_desc_ar,
      meta_desc_en,
      is_published,
    } = body

    await query(
      `UPDATE content_pages
       SET
         title_ar    = COALESCE($1, title_ar),
         title_en    = COALESCE($2, title_en),
         content_ar  = COALESCE($3, content_ar),
         content_en  = COALESCE($4, content_en),
         meta_desc_ar = COALESCE($5, meta_desc_ar),
         meta_desc_en = COALESCE($6, meta_desc_en),
         is_published = COALESCE($7, is_published),
         updated_by  = $8,
         updated_at  = NOW()
       WHERE slug = $9`,
      [
        title_ar ?? null,
        title_en ?? null,
        content_ar ?? null,
        content_en ?? null,
        meta_desc_ar ?? null,
        meta_desc_en ?? null,
        is_published ?? null,
        session.sub,
        slug,
      ]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ContentPages] PUT error:", error)
    return NextResponse.json({ error: "فشل في حفظ الصفحة" }, { status: 500 })
  }
}
