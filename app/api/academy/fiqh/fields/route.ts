import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const fields = await query(
      `SELECT id, name, label_ar, type, options, is_required, sort_order 
       FROM fiqh_form_fields 
       WHERE is_active = TRUE 
       ORDER BY sort_order ASC, created_at ASC`
    )
    return NextResponse.json({ fields })
  } catch (error) {
    console.error('[API] GET public fiqh_form_fields error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
