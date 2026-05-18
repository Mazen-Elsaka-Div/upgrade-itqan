import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"
import { seedDefaultStages, SUBJECTS, type Subject } from "@/lib/tajweed-paths"

const ADMIN_ROLES = ["admin", "student_supervisor", "reciter_supervisor", "teacher", "academy_admin"] as const
const ACADEMY_SUBJECTS: Subject[] = ["fiqh", "aqeedah", "seerah", "tafsir"]

type DbRecord = Record<string, unknown>
type PathStats = { enrolled: string; active: string; completed: string; avg_progress: string }
type LearningPathRow = DbRecord & { id: string; stats?: PathStats }

function isSubject(value: unknown): value is Subject {
  return typeof value === "string" && SUBJECTS.includes(value as Subject)
}

function selectedSubject(value: unknown, fallback: Subject) {
  return isSubject(value) ? value : fallback
}

async function getTableColumns(tableName: string) {
  const rows = await query<{ column_name: string }>(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1`,
    [tableName],
  )
  return new Set(rows.map(row => row.column_name))
}

async function tableExists(tableName: string) {
  const rows = await query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1
         FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = $1
     ) AS exists`,
    [tableName],
  )
  return rows[0]?.exists === true
}

function selectColumn(columns: Set<string>, column: string, fallback: string, alias = column) {
  return columns.has(column) ? `p.${column}` : `${fallback} AS ${alias}`
}

function defaultStats(): PathStats {
  return { enrolled: "0", active: "0", completed: "0", avg_progress: "0" }
}

function buildPathWhere(columns: Set<string>, subjectFilter: string | null, scope: string) {
  const where: string[] = []
  const params: unknown[] = []

  if (columns.has("is_active")) where.push("p.is_active = TRUE")

  if (columns.has("subject")) {
    if (subjectFilter && isSubject(subjectFilter)) {
      params.push(subjectFilter)
      where.push(`p.subject = $${params.length}`)
    }

    if (scope === "tajweed") {
      params.push(["tajweed"])
      where.push(`p.subject = ANY($${params.length}::text[])`)
    }

    if (scope === "academy") {
      params.push(ACADEMY_SUBJECTS)
      where.push(`p.subject = ANY($${params.length}::text[])`)
    }
  }

  return {
    clause: where.length ? `WHERE ${where.join(" AND ")}` : "",
    params,
  }
}

async function readLearningPaths(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const includeStats = searchParams.get("include_stats") === "1"
  const subjectFilter = searchParams.get("subject") || null
  const scope = (searchParams.get("scope") || "").toLowerCase()

  const columns = await getTableColumns("tajweed_paths")
  if (!columns.has("id")) {
    return { paths: [], warning: "learning_paths_unavailable" }
  }

  if (scope === "academy" && !columns.has("subject")) {
    return { paths: [], warning: "learning_paths_subject_unavailable" }
  }

  const usersAvailable = await tableExists("users")
  const joins: string[] = []
  if (usersAvailable && columns.has("created_by")) {
    joins.push("LEFT JOIN users u ON u.id = p.created_by")
  }
  if (usersAvailable && columns.has("manager_id")) {
    joins.push("LEFT JOIN users m ON m.id = p.manager_id")
  }

  const selectColumns = [
    "p.id",
    selectColumn(columns, "title", "''::text"),
    selectColumn(columns, "description", "NULL::text"),
    selectColumn(columns, "level", "'beginner'::text"),
    selectColumn(columns, "thumbnail_url", "NULL::text"),
    selectColumn(columns, "total_stages", "0::int"),
    selectColumn(columns, "estimated_days", "NULL::int"),
    selectColumn(columns, "require_audio", "FALSE::boolean"),
    selectColumn(columns, "is_published", "FALSE::boolean"),
    selectColumn(columns, "is_active", "TRUE::boolean"),
    selectColumn(columns, "subject", "'tajweed'::text"),
    selectColumn(columns, "manager_id", "NULL::uuid"),
    selectColumn(columns, "created_at", "NULL::timestamptz"),
    usersAvailable && columns.has("created_by") ? "u.name AS created_by_name" : "NULL::text AS created_by_name",
    usersAvailable && columns.has("manager_id") ? "m.name AS manager_name" : "NULL::text AS manager_name",
    usersAvailable && columns.has("manager_id") ? "m.email AS manager_email" : "NULL::text AS manager_email",
  ]
  const { clause, params } = buildPathWhere(columns, subjectFilter, scope)
  const order = [
    columns.has("is_published") ? "p.is_published DESC" : null,
    columns.has("created_at") ? "p.created_at DESC" : null,
    columns.has("title") ? "p.title ASC" : null,
  ].filter(Boolean).join(", ")

  let paths = await query<LearningPathRow>(
    `SELECT ${selectColumns.join(",\n              ")}
       FROM tajweed_paths p
       ${joins.join("\n       ")}
       ${clause}
      ${order ? `ORDER BY ${order}` : ""}`,
    params,
  )

  if (includeStats) {
    paths = await withStats(paths)
  }

  return { paths }
}

async function withStats(paths: LearningPathRow[]) {
  if (paths.length === 0) return paths
  const hasEnrollments = await tableExists("tajweed_path_enrollments")
  if (!hasEnrollments) return paths.map(path => ({ ...path, stats: defaultStats() }))

  try {
    const ids = paths.map(path => path.id)
    const stats = await query<{ path_id: string } & PathStats>(
      `SELECT
         e.path_id,
         COUNT(*)::text AS enrolled,
         COUNT(*) FILTER (WHERE e.status = 'active')::text AS active,
         COUNT(*) FILTER (WHERE e.status = 'completed')::text AS completed,
         ROUND(AVG(
           CASE WHEN p.total_stages > 0
             THEN (e.stages_completed::numeric / p.total_stages::numeric) * 100
             ELSE 0
           END
         ), 1)::text AS avg_progress
       FROM tajweed_path_enrollments e
       JOIN tajweed_paths p ON p.id = e.path_id
       WHERE e.path_id = ANY($1::uuid[])
       GROUP BY e.path_id`,
      [ids],
    )
    const byId = new Map(stats.map(row => [row.path_id, row]))
    return paths.map(path => ({ ...path, stats: byId.get(path.id) || defaultStats() }))
  } catch (error) {
    console.error("[admin tajweed paths stats]", error)
    return paths.map(path => ({ ...path, stats: defaultStats() }))
  }
}

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!requireRole(session, [...ADMIN_ROLES])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }

    return NextResponse.json(await readLearningPaths(req))
  } catch (err) {
    console.error("[admin tajweed paths GET]", err)
    return NextResponse.json({ paths: [], warning: "learning_paths_load_failed" })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!requireRole(session, [...ADMIN_ROLES])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }

    const body = await req.json() as DbRecord
    const title = typeof body.title === "string" ? body.title.trim() : ""
    if (!title) return NextResponse.json({ error: "العنوان مطلوب" }, { status: 400 })

    const columns = await getTableColumns("tajweed_paths")
    if (!columns.has("id") || !columns.has("title")) {
      return NextResponse.json({ error: "جدول مسارات التعلم غير جاهز" }, { status: 409 })
    }
    if (!columns.has("subject")) {
      return NextResponse.json({ error: "حقل التخصص غير متاح في جدول مسارات التعلم" }, { status: 409 })
    }

    const subjectCandidate = selectedSubject(body.subject, "fiqh")
    const subject = ACADEMY_SUBJECTS.includes(subjectCandidate) ? subjectCandidate : "fiqh"
    const seed = body.seed_default_stages !== false

    const insertColumns = ["title"]
    const values: unknown[] = [title]
    if (columns.has("description")) {
      insertColumns.push("description")
      values.push(typeof body.description === "string" && body.description.trim() ? body.description.trim() : null)
    }
    if (columns.has("level")) {
      insertColumns.push("level")
      values.push(typeof body.level === "string" ? body.level : "beginner")
    }
    if (columns.has("thumbnail_url")) {
      insertColumns.push("thumbnail_url")
      values.push(typeof body.thumbnail_url === "string" ? body.thumbnail_url : null)
    }
    if (columns.has("total_stages")) {
      insertColumns.push("total_stages")
      values.push(0)
    }
    if (columns.has("estimated_days")) {
      insertColumns.push("estimated_days")
      values.push(typeof body.estimated_days === "number" ? body.estimated_days : null)
    }
    if (columns.has("require_audio")) {
      insertColumns.push("require_audio")
      values.push(body.require_audio === true)
    }
    if (columns.has("is_published")) {
      insertColumns.push("is_published")
      values.push(body.is_published === true)
    }
    if (columns.has("created_by")) {
      insertColumns.push("created_by")
      values.push(session!.sub)
    }
    if (columns.has("subject")) {
      insertColumns.push("subject")
      values.push(subject)
    }
    if (columns.has("manager_id")) {
      insertColumns.push("manager_id")
      values.push(typeof body.manager_id === "string" && body.manager_id ? body.manager_id : null)
    }

    const placeholders = values.map((_, index) => `$${index + 1}`)
    const inserted = await query<LearningPathRow>(
      `INSERT INTO tajweed_paths (${insertColumns.join(", ")})
       VALUES (${placeholders.join(", ")})
       RETURNING *`,
      values,
    )
    const pathRow = inserted[0]
    let totalStages = 0

    if (seed && pathRow?.id) {
      try {
        totalStages = await seedDefaultStages(pathRow.id, subject)
        if (columns.has("total_stages")) {
          await query(`UPDATE tajweed_paths SET total_stages = $1 WHERE id = $2`, [totalStages, pathRow.id])
          pathRow.total_stages = totalStages
        }
      } catch (seedError) {
        console.error("[admin tajweed paths seed]", seedError)
      }
    }

    return NextResponse.json({ path: pathRow, total_stages: totalStages }, { status: 201 })
  } catch (err) {
    console.error("[admin tajweed paths POST]", err)
    return NextResponse.json({ error: "حدث خطأ في حفظ المسار" }, { status: 500 })
  }
}
