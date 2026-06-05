import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { evaluateEntry } from '@/lib/academy/competitions'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const session = await getSession()
  const isTeacher =
    session && (session.role === 'teacher' || session.academy_roles?.includes('teacher'))
  if (!session || (!isTeacher && session.role !== 'academy_admin' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { entryId } = await params

  try {
    const { score, tajweed_scores, feedback } = await req.json()
    if (score === undefined || score === null) {
      return NextResponse.json({ error: 'Score is required' }, { status: 400 })
    }

    // evaluateEntry enforces that the judge is assigned to the competition
    // (or is an admin), so teachers can only grade competitions they judge.
    const result = await evaluateEntry(entryId, session.sub, {
      score: Number(score),
      tajweedScores: tajweed_scores || {},
      feedback: feedback || null,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error evaluating entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
