import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET: public list of active fiqh categories (children of the "fiqh" root category)
export async function GET() {
  try {
    const categories = await query<{
      id: string
      slug: string
      name_ar: string
      name_en: string | null
      sort_order: number
    }>(
      `SELECT c.id, c.slug, c.name AS name_ar, c.name AS name_en, c.display_order AS sort_order
         FROM categories c
         JOIN categories parent ON parent.id = c.parent_id
        WHERE c.is_active = TRUE
          AND parent.slug = 'fiqh'
        ORDER BY c.display_order ASC, c.name ASC`
    )
    return NextResponse.json({ categories: categories || [] })
  } catch (error) {
    console.error('Failed to fetch fiqh categories:', error)
    return NextResponse.json({ categories: [] })
  }
}
