import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { previewCompetitionResults, finalizeCompetitionResults, getCompetition } from '@/lib/academy/competitions'

const ALLOWED_ROLES = ['reader', 'teacher', 'admin', 'academy_admin']

// GET: preview the proposed ranking (no writes) so the judge can review before confirming.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !ALLOWED_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    const competition = await getCompetition(id)
    if (!competition) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 })
    }
    const preview = await previewCompetitionResults(id)
    return NextResponse.json(preview)
  } catch (error) {
    console.error('Error previewing competition results:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: confirm and persist results — ranks, winners, points, and close the competition.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !ALLOWED_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    const result = await finalizeCompetitionResults(id)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error finalizing competition results:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
