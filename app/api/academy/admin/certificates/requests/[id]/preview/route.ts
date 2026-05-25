import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { buildValuesForRequest } from "@/lib/certificate/issue"
import { renderCertificate } from "@/lib/certificate/render"

const SCOPE = "academy" as const

function isAdmin(role: string | undefined) {
  return role === "admin" || role === "academy_admin"
}

interface Ctx {
  params: Promise<{ id: string }>
}

export const maxDuration = 60

// GET /api/academy/admin/certificates/requests/[id]/preview?format=png|pdf
// Renders the actual data for this request — useful for the admin to
// double-check before issuing.
export async function GET(req: NextRequest, { params }: Ctx) {
  const session = await getSession()
  if (!session || !isAdmin(session.role)) {
    return new NextResponse("Unauthorized", { status: 401 })
  }
  const { id } = await params

  const { searchParams } = new URL(req.url)
  const format = (searchParams.get("format") === "pdf" ? "pdf" : "png") as
    | "pdf"
    | "png"

  try {
    const built = await buildValuesForRequest(SCOPE, id)
    if (!built.template_url) {
      return NextResponse.json(
        { error: "Template not assigned yet" },
        { status: 400 },
      )
    }
    const buffer = await renderCertificate(
      {
        template_url: built.template_url,
        field_positions: built.field_positions,
        values: built.values,
        language: built.language,
      },
      format,
    )
    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": format === "png" ? "image/png" : "application/pdf",
        "Cache-Control": "no-store",
      },
    })
  } catch (e) {
    console.error("[request preview]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    )
  }
}
