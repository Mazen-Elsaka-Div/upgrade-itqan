import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { queryOne } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'parent') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { id: childId } = await params

    const result = await queryOne<{ get_parent_child_detail: any }>(
      'SELECT get_parent_child_detail($1, $2) as get_parent_child_detail',
      [session.sub, childId]
    )

    if (!result?.get_parent_child_detail) {
      return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
    }

    const detail = result.get_parent_child_detail

    if (detail.error) {
      return NextResponse.json({ error: detail.error }, { status: 403 })
    }

    return NextResponse.json(detail)
  } catch (error) {
    console.error('[API] /academy/parent/children/[id]/detail error:', error)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
