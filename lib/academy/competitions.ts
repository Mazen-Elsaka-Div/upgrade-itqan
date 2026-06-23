
import { query, queryOne, withTransaction } from '@/lib/db'
import { awardPoints } from '@/lib/academy/gamification'
import { en } from '@/lib/i18n/locales/en';

export async function getCompetitions(filters: { status?: string; type?: string; userId?: string; scope?: string } = {}) {
  let sql = `SELECT * FROM competitions WHERE 1=1`
  const params: any[] = []

  // 'all' (and empty) is a client sentinel meaning "no filter". No competition
  // ever has a literal status/type of 'all', so without this guard a request
  // like `?status=all` would filter `status = 'all'` and match nothing — which
  // silently broke the student detail page (it fetches the list with
  // `status=all` then finds by id, so every competition showed "not found").
  if (filters.status && filters.status !== 'all') {
    params.push(filters.status)
    sql += ` AND status = $${params.length}`
  }
  if (filters.type && filters.type !== 'all') {
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
  // Joining only registers participation. `submitted_at` stays NULL until the
  // student actually submits, so a joined-but-not-submitted entry is never
  // mistaken for a submission (and never shows a bogus submission date).
  return query(`
    INSERT INTO competition_entries (competition_id, student_id, status)
    VALUES ($1, $2, 'pending')
    ON CONFLICT (competition_id, student_id) DO NOTHING
    RETURNING *
  `, [competitionId, studentId])
}

export async function submitEntry(competitionId: string, studentId: string, data: {
  submission_url?: string | null
  notes?: string | null
  verses_count?: number
}): Promise<{ success: true; data: any } | { success: false; error: string }> {
  const comp = await queryOne<{ status: string; min_verses: number | null }>(
    `SELECT status, min_verses FROM competitions WHERE id = $1`,
    [competitionId]
  )
  if (!comp) return { success: false, error: ((en.extracted_2026_v2 as any)?.["المسابقة غير موجودة"] || "المسابقة غير موجودة") }
  if (comp.status !== 'active') return { success: false, error: ((en.extracted_2026_v2 as any)?.["المسابقة غير نشطة"] || "المسابقة غير نشطة") }

  const minVerses = Number(comp.min_verses) || 0
  const verses = Number(data.verses_count) || 0
  if (minVerses > 0 && verses < minVerses) {
    return { success: false, error: `${(en.extracted_2026_v2 as any)?.["الحد الأدنى للمشاركة هو "] || "الحد الأدنى للمشاركة هو "}${minVerses}${(en.extracted_2026_v2 as any)?.[" آية"] || " آية"}` }
  }

  // Block re-submission once an entry has already been judged.
  const existing = await queryOne<{ status: string }>(
    `SELECT status FROM competition_entries WHERE competition_id = $1 AND student_id = $2`,
    [competitionId, studentId]
  )
  if (existing && (existing.status === 'evaluated' || existing.status === 'winner')) {
    return { success: false, error: ((en.extracted_2026_v2 as any)?.["تم تقييم مشاركتك بالفعل ولا يمكن تعديلها"] || "تم تقييم مشاركتك بالفعل ولا يمكن تعديلها") }
  }

  // Ensure the participation row exists, then record the actual submission.
  await joinCompetition(competitionId, studentId)

  const rows = await query<any>(`
    UPDATE competition_entries
    SET submission_url = $3, notes = $4, verses_count = $5, status = 'pending', submitted_at = NOW()
    WHERE competition_id = $1 AND student_id = $2
    RETURNING *
  `, [competitionId, studentId, data.submission_url || null, data.notes || null, verses])

  return { success: true, data: rows[0] }
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
  if (!user) return { success: false as const, error: ((en.extracted_2026_v2 as any)?.["المستخدم غير موجود"] || "المستخدم غير موجود") }
  if (!(JUDGE_ROLES as readonly string[]).includes(user.role)) {
    return { success: false as const, error: ((en.extracted_2026_v2 as any)?.["يمكن تعيين المدرّسين أو المقرئين فقط كمحكّمين"] || "يمكن تعيين المدرّسين أو المقرئين فقط كمحكّمين") }
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
    const score = Number(evaluation.score)
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      return { success: false, error: ((en.extracted_2026_v2 as any)?.["الدرجة يجب أن تكون بين 0 و 100"] || "الدرجة يجب أن تكون بين 0 و 100") }
    }

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
      [score, JSON.stringify(evaluation.tajweedScores), evaluation.feedback, judgeId, entryId]
    )
    
    return { success: true }
  } catch (error) {
    console.error('Error evaluating entry:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Award points for a finishing position in a competition.
 *
 * `rank` 1/2/3 maps to the competition's configurable points_first/second/third
 * columns. Points are granted through the real gamification engine
 * (user_points + points_log) — NOT the old non-existent `student_points` table.
 *
 * Idempotent: if this student was already awarded competition points for this
 * competition we skip, so re-saving an evaluation never double-pays.
 */
export async function awardCompetitionRank(
  competitionId: string,
  studentId: string,
  rank: number,
) {
  try {
    const comp = await queryOne<{
      title: string | null
      points_multiplier: number | null
      points_first: number | null
      points_second: number | null
      points_third: number | null
    }>(
      `SELECT title, points_multiplier, points_first, points_second, points_third
         FROM competitions WHERE id = $1`,
      [competitionId],
    )
    if (!comp) return { success: false, error: 'Competition not found' }

    // The 1st-place finisher is recorded as the competition winner.
    if (rank === 1) {
      await query(
        `UPDATE competitions SET winner_id = $1 WHERE id = $2`,
        [studentId, competitionId],
      )
      await query(
        `UPDATE competition_entries SET status = 'winner' WHERE competition_id = $1 AND student_id = $2`,
        [competitionId, studentId],
      )
    }

    const rankPoints: Record<number, number> = {
      1: Number(comp.points_first ?? 500),
      2: Number(comp.points_second ?? 300),
      3: Number(comp.points_third ?? 150),
    }
    const basePoints = rankPoints[rank]
    if (!basePoints || basePoints <= 0) {
      // Only the top 3 ranks earn points.
      return { success: true, awarded: 0 }
    }

    const multiplier = Number(comp.points_multiplier) > 0 ? Number(comp.points_multiplier) : 1
    const points = Math.round(basePoints * multiplier)

    // Idempotency guard: skip if this student already has competition points
    // logged for this competition (regardless of rank changes).
    const already = await queryOne<{ id: string }>(
      `SELECT id FROM points_log
        WHERE user_id = $1 AND reason = 'competition_win'
          AND related_entity_type = 'competition' AND related_entity_id = $2
        LIMIT 1`,
      [studentId, competitionId],
    )
    if (already) {
      return { success: true, awarded: 0, alreadyAwarded: true }
    }

    const rankLabel = rank === 1 ? ((en.extracted_2026_v2 as any)?.["المركز الأول"] || "المركز الأول") : rank === 2 ? ((en.extracted_2026_v2 as any)?.["المركز الثاني"] || "المركز الثاني") : ((en.extracted_2026_v2 as any)?.["المركز الثالث"] || "المركز الثالث")
    await awardPoints(studentId, points, 'competition_win', {
      description: `${rankLabel}${((en.extracted_2026_v2 as any)?.[" في مسابقة: "] || " في مسابقة: ")}${comp.title ?? ''}`.trim(),
      relatedEntityType: 'competition',
      relatedEntityId: competitionId,
      applyStreakMultiplier: false,
    })

    return { success: true, awarded: points }
  } catch (error) {
    console.error('Error awarding competition rank:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/** Back-compat helper: awarding the winner is just rank #1. */
export async function awardCompetitionWinner(competitionId: string, studentId: string) {
  await query(`UPDATE competitions SET status = 'ended' WHERE id = $1`, [competitionId])
  return awardCompetitionRank(competitionId, studentId, 1)
}

export interface RankPreviewRow {
  entry_id: string
  student_id: string
  student_name: string | null
  score: number | null
  rank: number
  is_winner: boolean
}

/**
 * Compute the proposed ranking for a competition WITHOUT writing anything.
 * Evaluated entries are ordered by score (desc), then earliest submission as a
 * tie-breaker. The top `award_top_n` (default 3, capped at 3 for points) are
 * flagged as winners. Used to preview results before the judge confirms.
 */
export async function previewCompetitionResults(competitionId: string): Promise<{
  ready: boolean
  pending: number
  topN: number
  ranking: RankPreviewRow[]
}> {
  const comp = await queryOne<{ award_top_n: number | null }>(
    `SELECT award_top_n FROM competitions WHERE id = $1`,
    [competitionId],
  )
  const topN = Math.max(1, Number(comp?.award_top_n) || 3)

  const pendingRow = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM competition_entries
      WHERE competition_id = $1 AND submission_url IS NOT NULL AND status = 'pending'`,
    [competitionId],
  )
  const pending = Number(pendingRow?.count ?? 0)

  const evaluated = await query<{ id: string; student_id: string; student_name: string | null; score: number | null }>(
    `SELECT ce.id, ce.student_id, u.name AS student_name, ce.score
       FROM competition_entries ce
       JOIN users u ON u.id = ce.student_id
      WHERE ce.competition_id = $1
        AND ce.status IN ('evaluated', 'winner')
        AND ce.score IS NOT NULL
      ORDER BY ce.score DESC, ce.submitted_at ASC`,
    [competitionId],
  )

  const ranking: RankPreviewRow[] = evaluated.map((e, i) => ({
    entry_id: e.id,
    student_id: e.student_id,
    student_name: e.student_name,
    score: e.score,
    rank: i + 1,
    is_winner: i < topN,
  }))

  return { ready: evaluated.length > 0, pending, topN, ranking }
}

/**
 * Finalize a competition: persist the ranks computed from scores, mark the
 * winners, award points to the top finishers, and close the competition.
 * Idempotent on points (awardCompetitionRank guards against double-paying).
 */
export async function finalizeCompetitionResults(
  competitionId: string,
): Promise<{ success: boolean; error?: string; winners?: number; ranked?: number }> {
  try {
    const { ready, ranking } = await previewCompetitionResults(competitionId)
    if (!ready) {
      return { success: false, error: ((en.extracted_2026_v2 as any)?.["لا توجد مشاركات مُقيّمة لاعتماد نتائجها"] || "لا توجد مشاركات مُقيّمة لاعتماد نتائجها") }
    }

    // Reset any previous winner flags so re-finalizing reflects the latest scores.
    await query(
      `UPDATE competition_entries SET status = 'evaluated'
        WHERE competition_id = $1 AND status = 'winner'`,
      [competitionId],
    )

    // Persist every entry's computed rank.
    for (const row of ranking) {
      await query(
        `UPDATE competition_entries SET rank = $1 WHERE id = $2`,
        [row.rank, row.entry_id],
      )
    }

    // Award points + winner status for the top finishers (only ranks 1-3 earn points).
    let winners = 0
    for (const row of ranking) {
      if (row.is_winner) {
        await awardCompetitionRank(competitionId, row.student_id, row.rank)
        winners++
      }
    }

    // Close the competition once results are official.
    await query(`UPDATE competitions SET status = 'ended' WHERE id = $1`, [competitionId])

    return { success: true, winners, ranked: ranking.length }
  } catch (error) {
    console.error('Error finalizing competition results:', error)
    return { success: false, error: ((en.extracted_2026_v2 as any)?.["حدث خطأ أثناء اعتماد النتائج"] || "حدث خطأ أثناء اعتماد النتائج") }
  }
}
