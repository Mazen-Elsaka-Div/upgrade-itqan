import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { generateSerialCode } from "@/lib/certificates"
import { issueCertificateForRequest } from "@/lib/certificate/issue"

export const maxDuration = 60

const SCOPE = "academy" as const

function isAdmin(role: string | undefined) {
  return role === "admin" || role === "academy_admin"
}

interface Ctx {
  params: Promise<{ id: string }>
}

// GET single request (admin view)
export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await getSession()
  if (!session || !isAdmin(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params

  const request = await queryOne(
    `SELECT r.*,
            u.name AS student_name,
            u.email AS student_email,
            t.name AS template_name,
            t.template_url AS template_url,
            t.field_positions AS template_field_positions
       FROM certificate_issuance_requests r
       JOIN users u ON u.id = r.student_id
       LEFT JOIN certificate_templates t ON t.id = r.template_id
       WHERE r.id = $1 AND r.scope = $2`,
    [id, SCOPE],
  )
  if (!request) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json({ request })
}

// PATCH — actions: approve / reject / issue / assign_template
// Body shape per action:
//   { action: 'approve' }
//   { action: 'reject', reason: string }
//   { action: 'assign_template', template_id: string, language?: 'ar'|'en' }
//   { action: 'issue', pdf_url?: string }  (PR2 will wire actual rendering)
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await getSession()
  if (!session || !isAdmin(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body?.action) {
    return NextResponse.json({ error: "Missing action" }, { status: 400 })
  }

  const existing = await queryOne<{
    id: string
    student_id: string
    status: string
    serial_code: string | null
    certificate_number: string | null
    template_id: string | null
    kind: string
    source_table: string | null
    source_id: string | null
    language: string
  }>(
    `SELECT id, student_id, status, serial_code, certificate_number,
            template_id, kind, source_table, source_id, language
       FROM certificate_issuance_requests
       WHERE id = $1 AND scope = $2`,
    [id, SCOPE],
  )
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  switch (body.action) {
    case "approve": {
      if (!["submitted", "data_required"].includes(existing.status)) {
        return NextResponse.json(
          { error: "Cannot approve in current status" },
          { status: 400 },
        )
      }
      const [row] = await query(
        `UPDATE certificate_issuance_requests
            SET status = 'approved',
                approved_at = NOW(),
                approved_by = $2,
                rejection_reason = NULL
          WHERE id = $1
          RETURNING *`,
        [id, session.sub],
      )
      return NextResponse.json({ request: row })
    }

    case "reject": {
      const reason = (body.reason || "").toString().trim() || null
      const [row] = await query(
        `UPDATE certificate_issuance_requests
            SET status = 'rejected',
                rejection_reason = $2,
                approved_by = $3,
                approved_at = NOW()
          WHERE id = $1
          RETURNING *`,
        [id, reason, session.sub],
      )
      return NextResponse.json({ request: row })
    }

    case "assign_template": {
      if (!body.template_id) {
        return NextResponse.json(
          { error: "Missing template_id" },
          { status: 400 },
        )
      }
      const language = body.language || existing.language || "ar"
      const [row] = await query(
        `UPDATE certificate_issuance_requests
            SET template_id = $2, language = $3
          WHERE id = $1
          RETURNING *`,
        [id, body.template_id, language],
      )
      return NextResponse.json({ request: row })
    }

    case "issue": {
      // First, try to auto-render the certificate using the assigned
      // template.  If no template is assigned or the render fails the admin
      // can still pass an external `pdf_url` to mark it issued manually.
      const serial = existing.serial_code || (await generateSerialCode(SCOPE))
      const certNumber =
        existing.certificate_number ||
        serial ||
        `ACA-${Date.now().toString(36).toUpperCase()}`

      let pdfUrl: string | null = body.pdf_url || null
      const autoRender = body.auto_render !== false && !pdfUrl

      if (autoRender && existing.template_id) {
        try {
          const r = await issueCertificateForRequest({
            request_id: id,
            scope: SCOPE,
            format: body.format === "png" ? "png" : "pdf",
          })
          pdfUrl = r.pdf_url
        } catch (e) {
          console.error("[issue] auto-render failed", e)
          // Fall through — admin will get an error and can retry or provide URL.
          if (!body.allow_no_pdf) {
            return NextResponse.json(
              {
                error: "Auto-render failed",
                detail: e instanceof Error ? e.message : String(e),
              },
              { status: 500 },
            )
          }
        }
      }

      const [row] = await query(
        `UPDATE certificate_issuance_requests
            SET status = 'issued',
                issued_at = NOW(),
                serial_code = $2,
                certificate_number = $3,
                pdf_url = COALESCE($4, pdf_url)
          WHERE id = $1
          RETURNING *`,
        [id, serial, certNumber, pdfUrl],
      )

      // Also persist the issued certificate in academy_certificates for the
      // student-facing list page (which already queries that table).
      // We only do this when source_id resolves to a course or when kind=course.
      if (existing.kind === "course" && existing.source_id) {
        await query(
          `INSERT INTO academy_certificates
              (student_id, course_id, issued_at, certificate_number,
               pdf_url, request_id, template_id, language, kind, issued_by)
            VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT DO NOTHING`,
          [
            existing.student_id,
            existing.source_id,
            certNumber,
            pdfUrl,
            id,
            existing.template_id,
            existing.language,
            existing.kind,
            session.sub,
          ],
        ).catch(() => {})
      } else {
        // Generic insert for non-course types (course_id is now nullable
        // thanks to migration 040).
        await query(
          `INSERT INTO academy_certificates
              (student_id, course_id, issued_at, certificate_number,
               pdf_url, request_id, template_id, language, kind, issued_by,
               source_table, source_id)
            VALUES ($1, NULL, NOW(), $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            existing.student_id,
            certNumber,
            pdfUrl,
            id,
            existing.template_id,
            existing.language,
            existing.kind,
            session.sub,
            existing.source_table,
            existing.source_id,
          ],
        ).catch(() => {})
      }

      // Notify student
      await query(
        `INSERT INTO notifications (user_id, title, message, type, link, created_at)
         VALUES ($1, $2, $3, 'certificate', '/academy/student/certificates', NOW())`,
        [
          existing.student_id,
          "تم إصدار شهادتك",
          "تهانينا! تم إصدار شهادتك بنجاح. اضغط هنا لعرضها وتحميلها.",
        ],
      ).catch(() => {})

      return NextResponse.json({ request: row })
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  }
}
