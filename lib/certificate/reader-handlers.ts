// Reader-side (Maqraa) handlers for the certificates centre.
//
// A reader (مقرئ) can review and approve certificate issuance requests, but
// ONLY for requests whose source path they own — i.e. tajweed_paths or
// memorization_paths where (created_by = session.sub OR manager_id = session.sub).
// Academy/platform admins are also permitted so they can act on the same surface.
//
// Scope is always 'maqraa'.  Approval triggers the shared autoIssueRequest
// helper (approve → render → issue → notify).

import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { createNotification } from "@/lib/notifications"
import { autoIssueRequest } from "@/lib/certificate/eligibility"

const ADMIN_ROLES = ["admin", "academy_admin"]
const ALLOWED_ROLES = ["reader", "admin", "academy_admin"]

/**
 * Load a maqraa-scoped request and verify the caller may act on it.
 *
 * Readers may act on tajweed_paths and memorization_paths they own.
 * Admins may act on any maqraa request.
 */
async function loadOwnedRequest(
  requestId: string,
  session: { sub: string; role?: string },
) {
  const req = await queryOne<{
    id: string
    student_id: string
    status: string
    kind: string
    source_table: string | null
    source_id: string | null
    tajweed_created_by: string | null
    tajweed_manager_id: string | null
    memo_created_by: string | null
    memo_manager_id: string | null
  }>(
    `SELECT r.id, r.student_id, r.status, r.kind,
            r.source_table, r.source_id,
            tp.created_by  AS tajweed_created_by,
            tp.manager_id  AS tajweed_manager_id,
            mp.created_by  AS memo_created_by,
            mp.manager_id  AS memo_manager_id
       FROM certificate_issuance_requests r
       LEFT JOIN tajweed_paths tp
         ON r.source_table = 'tajweed_paths' AND tp.id = r.source_id
       LEFT JOIN memorization_paths mp
         ON r.source_table = 'memorization_paths' AND mp.id = r.source_id
      WHERE r.id = $1 AND r.scope = 'maqraa'`,
    [requestId],
  )
  if (!req) return null

  const isAdmin = ADMIN_ROLES.includes(session.role || "")
  if (isAdmin) return req

  // Tajweed path: must own or manage the path.
  if (req.source_table === "tajweed_paths" && req.source_id) {
    const owns =
      req.tajweed_created_by === session.sub ||
      req.tajweed_manager_id === session.sub
    return owns ? req : null
  }
  // Memorization path: must own or manage the path.
  if (req.source_table === "memorization_paths" && req.source_id) {
    const owns =
      req.memo_created_by === session.sub ||
      req.memo_manager_id === session.sub
    return owns ? req : null
  }
  return null
}

// =====================================================================
//                   GET /reader/certificates/requests
// =====================================================================
export function makeReaderRequestsListGet() {
  return async function GET(req: NextRequest) {
    const session = await getSession()
    if (!session || !requireRole(session, ALLOWED_ROLES)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")

    const isAdmin = ADMIN_ROLES.includes(session.role || "")

    const filters: string[] = [
      "r.scope = 'maqraa'",
      "r.source_table IN ('tajweed_paths', 'memorization_paths')",
    ]
    const params: unknown[] = []

    if (!isAdmin) {
      params.push(session.sub)
      const p = `$${params.length}`
      filters.push(
        `(
          (r.source_table = 'tajweed_paths'      AND (tp.created_by = ${p} OR tp.manager_id = ${p}))
          OR
          (r.source_table = 'memorization_paths' AND (mp.created_by = ${p} OR mp.manager_id = ${p}))
        )`,
      )
    }
    if (status && status !== "all") {
      params.push(status)
      filters.push(`r.status = $${params.length}`)
    }

    const rows = await query(
      `SELECT r.id, r.status, r.kind, r.language, r.data,
              r.source_label, r.source_id, r.source_table,
              r.rejection_reason, r.certificate_number, r.pdf_url,
              r.requested_at, r.submitted_at, r.approved_at, r.issued_at,
              u.name  AS student_name,
              u.email AS student_email,
              COALESCE(tp.title, mp.title, r.source_label) AS path_title
         FROM certificate_issuance_requests r
         JOIN users u ON u.id = r.student_id
         LEFT JOIN tajweed_paths tp
           ON r.source_table = 'tajweed_paths' AND tp.id = r.source_id
         LEFT JOIN memorization_paths mp
           ON r.source_table = 'memorization_paths' AND mp.id = r.source_id
        WHERE ${filters.join(" AND ")}
        ORDER BY
          CASE r.status
            WHEN 'submitted'     THEN 0
            WHEN 'data_required' THEN 1
            WHEN 'approved'      THEN 2
            WHEN 'issued'        THEN 3
            WHEN 'rejected'      THEN 4
            ELSE 5
          END,
          r.submitted_at DESC NULLS LAST, r.requested_at DESC`,
      params,
    ).catch(() => [])

    // Counts for the filter tabs.
    const countFilters = [
      "scope = 'maqraa'",
      "source_table IN ('tajweed_paths', 'memorization_paths')",
    ]
    const countParams: unknown[] = []
    if (!isAdmin) {
      countParams.push(session.sub)
      const p = `$${countParams.length}`
      countFilters.push(
        `(
          (source_table = 'tajweed_paths'      AND source_id IN (SELECT id FROM tajweed_paths      WHERE created_by = ${p} OR manager_id = ${p}))
          OR
          (source_table = 'memorization_paths' AND source_id IN (SELECT id FROM memorization_paths WHERE created_by = ${p} OR manager_id = ${p}))
        )`,
      )
    }
    const counts = await query<{ status: string; count: string }>(
      `SELECT status, COUNT(*)::text AS count
         FROM certificate_issuance_requests
        WHERE ${countFilters.join(" AND ")}
        GROUP BY status`,
      countParams,
    ).catch(() => [])

    return NextResponse.json({
      requests: rows,
      counts: counts.reduce<Record<string, number>>((acc, c) => {
        acc[c.status] = Number(c.count)
        return acc
      }, {}),
    })
  }
}

// =====================================================================
//              PATCH /reader/certificates/requests/[id]
// =====================================================================
export function makeReaderRequestPatch() {
  return async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    try {
      const session = await getSession()
      if (!session || !requireRole(session, ALLOWED_ROLES)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const { id } = await params
      const body = await req.json().catch(() => null)
      if (!body?.action) {
        return NextResponse.json({ error: "Missing action" }, { status: 400 })
      }

      const existing = await loadOwnedRequest(id, session)
      if (!existing) {
        return NextResponse.json(
          { error: "Not found or not permitted" },
          { status: 404 },
        )
      }

      switch (body.action) {
        case "approve": {
          if (!["submitted", "approved"].includes(existing.status)) {
            return NextResponse.json(
              { error: "Cannot approve in current status" },
              { status: 400 },
            )
          }
          await query(
            `UPDATE certificate_issuance_requests
                SET approved_by = $2, approved_at = COALESCE(approved_at, NOW())
              WHERE id = $1`,
            [id, session.sub],
          )
          const result = await autoIssueRequest(id, "maqraa")
          if (!result.issued) {
            const errMsg =
              (result as any).error ||
              (result as any).reason ||
              "تأكد من وجود قالب شهادة افتراضي للمسارات."
            return NextResponse.json(
              { error: `تعذر إصدار الشهادة. السبب: ${errMsg}` },
              { status: 500 },
            )
          }
          const row = await queryOne(
            `SELECT * FROM certificate_issuance_requests WHERE id = $1`,
            [id],
          )
          return NextResponse.json({ request: row, issued: true })
        }

        case "reject": {
          if (!["submitted", "approved"].includes(existing.status)) {
            return NextResponse.json(
              { error: "Cannot reject in current status" },
              { status: 400 },
            )
          }
          const reason = (body.reason || "").toString().trim() || null
          const [row] = await query(
            `UPDATE certificate_issuance_requests
                SET status = 'rejected', rejection_reason = $2,
                    approved_by = $3, approved_at = NOW()
              WHERE id = $1 RETURNING *`,
            [id, reason, session.sub],
          )
          await createNotification({
            userId: existing.student_id,
            type: "general",
            title: "تم رفض طلب الشهادة",
            message: reason
              ? `سبب الرفض: ${reason}`
              : "تم رفض طلب إصدار شهادتك. يمكنك مراجعة البيانات وإعادة الإرسال.",
            category: "system",
            link: "/student/certificates",
            dedupKey: `cert-rejected:${id}:${Date.now()}`,
          }).catch(() => {})
          return NextResponse.json({ request: row })
        }

        default:
          return NextResponse.json({ error: "Unknown action" }, { status: 400 })
      }
    } catch (err) {
      console.error("[reader-handlers] PATCH failed", err)
      return NextResponse.json(
        { error: "حدث خطأ غير متوقع أثناء تنفيذ الإجراء. حاول مرة أخرى." },
        { status: 500 },
      )
    }
  }
}
