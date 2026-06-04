import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getJudgeAssignments } from '@/lib/academy/competitions'

export async function GET(_req: NextRequest) {
  const session = await getSession()
  const isTeacher =
    session && (session.role === 'teacher' || session.academy_roles?.includes('teacher'))
  if (!session || (!isTeacher && session.role !== 'academy_admin' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Teachers only see competitions they were explicitly assigned to judge.
    const assigned = await getJudgeAssignments(session.sub)
    return NextResponse.json({ data: assigned })
  } catch (error) {
    console.error('Error fetching teacher competitions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
