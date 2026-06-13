import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { queryOne } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface DashboardOverview {
  parent: {
    id: string
    name: string
    email: string
    avatar_url: string | null
  }
  summary: {
    total_children: number
    pending_requests: number
    rejected_links: number
    active_count: number
  }
  children: Array<{
    link_id: string
    child_id: string
    child_name: string
    child_avatar: string | null
    relation: string
    linked_at: string
    enrollments: {
      total: number
      active: number
      completed: number
      avg_progress: number
    }
    recitations: {
      total_30d: number
      last_at: string | null
    }
    bookings: {
      upcoming: number
    }
    weekly_activity: {
      recitations: number
      bookings: number
    }
    badges: {
      total: number
    }
  }>
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'parent') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const result = await queryOne<{ get_parent_dashboard_overview: string }>(
      'SELECT get_parent_dashboard_overview($1) as get_parent_dashboard_overview',
      [session.sub]
    )

    if (!result) {
      return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
    }

    let overview: DashboardOverview
    if (typeof result.get_parent_dashboard_overview === 'string') {
      overview = JSON.parse(result.get_parent_dashboard_overview)
    } else {
      overview = result.get_parent_dashboard_overview as unknown as DashboardOverview
    }

    return NextResponse.json(overview)
  } catch (error) {
    console.error('[API] /academy/parent/overview error:', error)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
