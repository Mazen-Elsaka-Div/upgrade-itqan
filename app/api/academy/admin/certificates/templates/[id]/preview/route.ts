import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { queryOne } from "@/lib/db"
import { getAllSettings } from "@/lib/certificates"
import { renderCertificate } from "@/lib/certificate/render"
import { ALL_FIELDS, type FieldAnchor } from "@/lib/certificate/fields"

const SCOPE = "academy" as const

function isAdmin(role: string | undefined) {
  return role === "admin" || role === "academy_admin"
}

interface Ctx {
  params: Promise<{ id: string }>
}

export const maxDuration = 60

// GET /api/academy/admin/certificates/templates/[id]/preview?format=png|pdf
// Renders a preview with sample data and the asset URLs from settings.
export async function GET(req: NextRequest, { params }: Ctx) {
  const session = await getSession()
  if (!session || !isAdmin(session.role)) {
    return new NextResponse("Unauthorized", { status: 401 })
  }
  const { id } = await params

  const template = await queryOne<{
    template_url: string
    field_positions: Record<string, FieldAnchor>
    language: "ar" | "en"
  }>(
    `SELECT template_url, field_positions, language
       FROM certificate_templates
       WHERE id = $1 AND scope = $2`,
    [id, SCOPE],
  )
  if (!template) {
    return new NextResponse("Not found", { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const format = (searchParams.get("format") === "pdf" ? "pdf" : "png") as
    | "pdf"
    | "png"

  const settings = await getAllSettings(SCOPE)
  const isAr = template.language === "ar"
  const platformName =
    (isAr
      ? (settings.platform_name_ar as string)
      : (settings.platform_name_en as string)) || ""

  const sampleValues: Record<string, string> = {}
  for (const f of ALL_FIELDS) {
    if (f.key === "logo") {
      const url = settings.logo_url as string | undefined
      if (url) sampleValues.logo = url
    } else if (f.key === "watermark") {
      const url = settings.watermark_url as string | undefined
      if (url) sampleValues.watermark = url
    } else if (f.key === "signature") {
      const url = settings.signature_url as string | undefined
      if (url) sampleValues.signature = url
    } else if (f.key === "platform_name") {
      sampleValues.platform_name = platformName || f.sample
    } else if (f.key === "signer_name") {
      sampleValues.signer_name =
        (settings.default_signer_name as string) || f.sample
    } else if (f.key === "signer_title") {
      sampleValues.signer_title =
        (settings.default_signer_title as string) || f.sample
    } else {
      sampleValues[f.key] = f.sample
    }
  }

  try {
    const buffer = await renderCertificate(
      {
        template_url: template.template_url,
        field_positions: template.field_positions || {},
        values: sampleValues,
        language: template.language || "ar",
        use_samples: true,
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
    console.error("[cert preview]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    )
  }
}
