import { query, queryOne } from '@/lib/db'

export async function getCompetitions(filters: { status?: string; type?: string; userId?: string; scope?: string } = {}) {
  let sql = `SELECT * FROM competitions WHERE 1=1`
  const params: any[] = []
  
  if (filters.status) {
    params.push(filters.status)
    sql += ` AND status = $${params.length}`
  }
  if (filters.type) {
    params.push(filters.type)
    sql += ` AND type = $${params.length}`
  }
  if (filters.scope) {
    params.push(filters.scope)
    sql += ` AND scope = $${params.length}`
  }
  
  sql += ` ORDER BY start_date DESC`
  
  const competitions = await query<any>(sql, params)
  
  if (filters.userId) {
    const entries = await query<{ competition_id: string }>(
      `SELECT competition_id FROM competition_entries WHERE student_id = $1`,
      [filters.userId]
    )
    const enteredIds = new Set(entries.map((e) => e.competition_id))
    return competitions.map((c) => ({
      ...c,
      has_joined: enteredIds.has(c.id),
      has_entered: enteredIds.has(c.id)
    }))
  }
  
  return competitions
}

export async function getLibraryCompetitions(filters: { status?: string; userId?: string } = {}) {
  return getCompetitions({ ...filters, scope: 'library' })
}

export async function getAcademyCompetitions(filters: { status?: string; type?: string; userId?: string } = {}) {
  return getCompetitions({ ...filters, scope: 'academy' })
}

export async function getStudentEntries(studentId: string, scope?: string) {
  let sql = `
    SELECT ce.*, c.title as competition_title, c.type as competition_type, c.scope as competition_scope
    FROM competition_entries ce
    JOIN competitions c ON c.id = ce.competition_id
    WHERE ce.student_id = $1
  `
  const params: any[] = [studentId]
  if (scope) {
    params.push(scope)
    sql += ` AND c.scope = $${params.length}`
  }
  sql += ` ORDER BY ce.submitted_at DESC`
  return query(sql, params)
}

export async function getEntries(competitionId: string) {
  return query(`
    SELECT ce.*, u.name as student_name, u.email as student_email,
           u.avatar_url as student_avatar_url,
           evaluator.name as evaluated_by_name
    FROM competition_entries ce
    JOIN users u ON u.id = ce.student_id
    LEFT JOIN users evaluator ON evaluator.id = ce.evaluated_by
    WHERE ce.competition_id = $1
    ORDER BY ce.rank ASC NULLS LAST, ce.score DESC NULLS LAST, ce.submitted_at DESC
  `, [competitionId])
}

export async function getCompetition(id: string) {
  return queryOne(`SELECT * FROM competitions WHERE id = $1`, [id])
}

export async function joinCompetition(competitionId: string, studentId: string) {
  return query(`
    INSERT INTO competition_entries (competition_id, student_id, status, submitted_at)
    VALUES ($1, $2, 'pending', NOW())
    ON CONFLICT (competition_id, student_id) DO NOTHING
    RETURNING *
  `, [competitionId, studentId])
}

export async function submitEntry(competitionId: string, studentId: string, data: {
  submission_url?: string | null
  notes?: string | null
  verses_count?: number
}) {
  // First join if not already joined
  await joinCompetition(competitionId, studentId)
  
  return query(`
    UPDATE competition_entries
    SET submission_url = $3, notes = $4, verses_count = $5, status = 'pending', submitted_at = NOW()
    WHERE competition_id = $1 AND student_id = $2
    RETURNING *
  `, [competitionId, studentId, data.submission_url || null, data.notes || null, data.verses_count || 0])
}

export async function getJudgeAssignments(judgeId: string) {
  const assigned = await query(`
    SELECT c.*, COUNT(ce.id)::int AS participants_count,
      COUNT(ce.id) FILTER (WHERE ce.submission_url IS NOT NULL AND ce.status = 'pending')::int AS pending_count
    FROM competitions c
    JOIN competition_judges cj ON cj.competition_id = c.id
    LEFT JOIN competition_entries ce ON ce.competition_id = c.id
    WHERE cj.judge_id = $1
    GROUP BY c.id
    ORDER BY c.start_date DESC
  `, [judgeId])
  return assigned
}

// Roles allowed to be assigned as competition judges.
export const JUDGE_ROLES = ['teacher', 'reader'] as const

export interface JudgeRow {
  id: string
  judge_id: string
  assigned_at: string
  name: string | null
  email: string | null
  role: string
  avatar_url: string | null
}

export interface CandidateJudge {
  id: string
  name: string | null
  email: string | null
  role: string
  avatar_url: string | null
}

/** Judges currently assigned to a competition. */
export async function getCompetitionJudges(competitionId: string): Promise<JudgeRow[]> {
  return query<JudgeRow>(
    `SELECT cj.id, cj.judge_id, cj.assigned_at,
            u.name, u.email, u.role, u.avatar_url
     FROM competition_judges cj
     JOIN users u ON u.id = cj.judge_id
     WHERE cj.competition_id = $1
     ORDER BY cj.assigned_at ASC`,
    [competitionId]
  )
}

/**
 * Users eligible to be assigned as judges (teachers + reciters). Optional
 * free-text search on name/email. Capped to keep the picker responsive.
 */
export async function getCandidateJudges(search?: string): Promise<CandidateJudge[]> {
  const params: any[] = []
  let sql = `SELECT id, name, email, role, avatar_url
             FROM users
             WHERE role = ANY($1)`
  params.push(JUDGE_ROLES as unknown as string[])
  if (search && search.trim()) {
    params.push(`%${search.trim()}%`)
    sql += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length})`
  }
  sql += ` ORDER BY name ASC NULLS LAST LIMIT 100`
  return query<CandidateJudge>(sql, params)
}

export async function addCompetitionJudge(competitionId: string, judgeId: string) {
  const user = await queryOne<{ role: string }>(`SELECT role FROM users WHERE id = $1`, [judgeId])
  if (!user) return { success: false as const, error: 'المستخدم غير موجود' }
  if (!(JUDGE_ROLES as readonly string[]).includes(user.role)) {
    return { success: false as const, error: 'يمكن تعيين المدرّسين أو المقرئين فقط كمحكّمين' }
  }
  await query(
    `INSERT INTO competition_judges (competition_id, judge_id)
     VALUES ($1, $2)
     ON CONFLICT (competition_id, judge_id) DO NOTHING`,
    [competitionId, judgeId]
  )
  return { success: true as const }
}

export async function removeCompetitionJudge(competitionId: string, judgeId: string) {
  await query(
    `DELETE FROM competition_judges WHERE competition_id = $1 AND judge_id = $2`,
    [competitionId, judgeId]
  )
  return { success: true as const }
}

export async function evaluateEntry(entryId: string, judgeId: string, evaluation: { score: number; tajweedScores: any; feedback: string | null }) {
  try {
    const entry = await queryOne<{ competition_id: string }>(
      `SELECT competition_id FROM competition_entries WHERE id = $1`,
      [entryId]
    )
    if (!entry) return { success: false, error: 'Entry not found' }

    // Check if the judge is assigned to this competition
    const isJudge = await queryOne(
      `SELECT 1 FROM competition_judges WHERE competition_id = $1 AND judge_id = $2`,
      [entry.competition_id, judgeId]
    )
    
    // Also allow admins/academy_admins/reader
    const user = await queryOne<{ role: string }>(`SELECT role FROM users WHERE id = $1`, [judgeId])
    const isAdmin = user && ['admin', 'academy_admin', 'reader'].includes(user.role)
    
    if (!isJudge && !isAdmin) {
      return { success: false, error: 'Unauthorized judge' }
    }

    await query(
      `UPDATE competition_entries
       SET score = $1, tajweed_scores = $2, feedback = $3, status = 'evaluated', evaluated_at = NOW(), evaluated_by = $4
       WHERE id = $5`,
      [evaluation.score, JSON.stringify(evaluation.tajweedScores), evaluation.feedback, judgeId, entryId]
    )
    
    return { success: true }
  } catch (error) {
    console.error('Error evaluating entry:', error)
    return { success: false, error: 'Internal server error' }
  }
}

export async function awardCompetitionWinner(competitionId: string, studentId: string) {
  try {
    await query(
      `UPDATE competitions SET winner_id = $1, status = 'ended' WHERE id = $2`,
      [studentId, competitionId]
    )
    await query(
      `UPDATE competition_entries SET status = 'winner' WHERE competition_id = $1 AND student_id = $2`,
      [competitionId, studentId]
    )
    
    const comp = await queryOne<{ points_multiplier: number; badge_key: string | null }>(
      `SELECT points_multiplier, badge_key FROM competitions WHERE id = $1`,
      [competitionId]
    )
    if (comp) {
      const basePoints = 50
      const points = Math.round(basePoints * (Number(comp.points_multiplier) || 1))
      await query(
        `INSERT INTO student_points (student_id, points, reason, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT DO NOTHING`,
        [studentId, points, `فائز مسابقة - ${competitionId}`]
      ).catch(() => {})
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error awarding winner:', error)
    return { success: false, error: 'Internal server error' }
  }
}
