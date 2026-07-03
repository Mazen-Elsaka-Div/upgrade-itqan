import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { isLiveKitConfigured } from "@/lib/livekit"
import { isRecordingConfigured } from "@/lib/livekit"
import { getSmtpUrl } from "@/lib/settings"

export const dynamic = "force-dynamic"

function isSuperAdmin(session: NonNullable<Awaited<ReturnType<typeof getSession>>>) {
  return session.role === "admin" || (session.role as string) === "super_admin"
}

// GET /api/admin/integrations
// Returns connection status for every external service.
// NEVER exposes secret values — boolean flags only.
export async function GET() {
  const session = await getSession()
  if (!session || !isSuperAdmin(session)) {
    return NextResponse.json({ error: "مخصص للمدير العام فقط" }, { status: 403 })
  }

  // --- Database (Postgres / Supabase) ---
  const dbConfigured = Boolean(
    process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.SUPABASE_URL
  )
  const supabaseConfigured = Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // --- Email (SMTP via system_settings or env) ---
  let smtpConfigured = false
  try {
    const smtpUrl = await getSmtpUrl()
    smtpConfigured = Boolean(smtpUrl)
  } catch {
    smtpConfigured = false
  }

  // --- Video (LiveKit) ---
  const liveKitConfigured = isLiveKitConfigured()

  // --- Recording (S3 for LiveKit egress) ---
  const recordingConfigured = isRecordingConfigured()

  // --- Storage ---
  const storageS3 = Boolean(
    process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      (process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET)
  )
  const storageCloudinary = Boolean(
    process.env.CLOUDINARY_URL ||
      (process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET)
  )
  const storageBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN)

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    integrations: [
      {
        id: "database",
        name: "قاعدة البيانات (PostgreSQL)",
        description: "قاعدة البيانات الرئيسية للمنصة",
        category: "core",
        status: dbConfigured ? "connected" : "missing",
        canTest: false,
      },
      {
        id: "supabase",
        name: "Supabase",
        description: "خدمة التخزين والمصادقة والملفات",
        category: "core",
        status: supabaseConfigured ? "connected" : "missing",
        canTest: false,
      },
      {
        id: "smtp",
        name: "البريد الإلكتروني (SMTP)",
        description: "خدمة إرسال البريد الإلكتروني للمستخدمين",
        category: "communication",
        status: smtpConfigured ? "connected" : "missing",
        canTest: smtpConfigured,
      },
      {
        id: "livekit",
        name: "LiveKit (الفيديو المباشر)",
        description: "خدمة الجلسات والدروس المباشرة بين المقرئين والطلاب",
        category: "media",
        status: liveKitConfigured ? "connected" : "missing",
        canTest: false,
      },
      {
        id: "recording",
        name: "تخزين التسجيلات (S3)",
        description: "تخزين تسجيلات الجلسات والحصص المباشرة",
        category: "media",
        status: recordingConfigured ? "connected" : "missing",
        canTest: false,
      },
      {
        id: "storage_s3",
        name: "التخزين السحابي (AWS S3)",
        description: "رفع وتخزين الملفات والصور",
        category: "storage",
        status: storageS3 ? "connected" : "missing",
        canTest: false,
      },
      {
        id: "storage_cloudinary",
        name: "Cloudinary",
        description: "معالجة وتخزين الصور والوسائط",
        category: "storage",
        status: storageCloudinary ? "connected" : "missing",
        canTest: false,
      },
      {
        id: "storage_blob",
        name: "Vercel Blob",
        description: "تخزين الملفات الثنائية وملفات التطبيق",
        category: "storage",
        status: storageBlob ? "connected" : "missing",
        canTest: false,
      },
    ],
  })
}
