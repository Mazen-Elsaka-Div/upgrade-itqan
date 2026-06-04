import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { queryOne } from '@/lib/db'
import { getEntries, getCompetition } from '@/lib/academy/competitions'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const isTeacher =
    session && (session.role === 'teacher' || session.academy_roles?.includes('teacher'))
  if (!session || (!isTeacher && session.role !== 'academy_admin' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // A teacher may only view entries for a competition they judge.
    if (isTeacher && session.role !== 'academy_admin' && session.role !== 'admin') {
      const assigned = await queryOne(
        `SELECT 1 FROM competition_judges WHERE competition_id = $1 AND judge_id = $2`,
        [id, session.sub]
      )
      if (!assigned) {
        return NextResponse.json({ error: 'غير مُسند لك تحكيم هذه المسابقة' }, { status: 403 })
      }
    }

    const [competition, entries] = await Promise.all([getCompetition(id), getEntries(id)])
    if (!competition) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 })
    }

    return NextResponse.json({ competition, entries })
  } catch (error) {
    console.error('Error fetching teacher competition entries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
