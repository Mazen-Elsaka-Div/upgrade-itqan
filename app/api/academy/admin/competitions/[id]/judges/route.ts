import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { queryOne } from '@/lib/db'
import {
  getCompetitionJudges,
  getCandidateJudges,
  addCompetitionJudge,
  removeCompetitionJudge,
} from '@/lib/academy/competitions'

const ALLOWED = ['academy_admin', 'admin']

async function ensureAcademyCompetition(id: string) {
  return queryOne<{ id: string }>(
    `SELECT id FROM competitions WHERE id = $1 AND scope = 'academy'`,
    [id]
  )
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !ALLOWED.includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    const comp = await ensureAcademyCompetition(id)
    if (!comp) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const search = new URL(req.url).searchParams.get('search') || undefined
    const [judges, candidates] = await Promise.all([
      getCompetitionJudges(id),
      getCandidateJudges(search),
    ])
    return NextResponse.json({ judges, candidates })
  } catch (error) {
    console.error('Error fetching competition judges:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !ALLOWED.includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    const comp = await ensureAcademyCompetition(id)
    if (!comp) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { judge_id } = await req.json()
    if (!judge_id) return NextResponse.json({ error: 'judge_id مطلوب' }, { status: 400 })

    const result = await addCompetitionJudge(id, judge_id)
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })

    return NextResponse.json({ judges: await getCompetitionJudges(id) })
  } catch (error) {
    console.error('Error adding competition judge:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !ALLOWED.includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    const comp = await ensureAcademyCompetition(id)
    if (!comp) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const judgeId = new URL(req.url).searchParams.get('judge_id')
    if (!judgeId) return NextResponse.json({ error: 'judge_id مطلوب' }, { status: 400 })

    await removeCompetitionJudge(id, judgeId)
    return NextResponse.json({ judges: await getCompetitionJudges(id) })
  } catch (error) {
    console.error('Error removing competition judge:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
