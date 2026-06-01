import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { uploadToStorage } from "@/lib/storage"
import { transliterate } from "transliteration"

// Force Node.js runtime — S3 upload uses the AWS SDK which relies on Node APIs.
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Server-side PDF upload helper used by the applicant PDF uploader.
 * Accepts multipart/form-data with field `file` and uploads it to AWS S3,
 * returning the public URL + key.
 */
export async function POST(req: NextRequest) {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    try {
        const fd = await req.formData()
        const file = fd.get("file") as File | null
        if (!file) return NextResponse.json({ error: "لا يوجد ملف" }, { status: 400 })

        if (file.type !== "application/pdf") {
            return NextResponse.json({ error: "الملف يجب أن يكون PDF" }, { status: 400 })
        }
        if (file.size > 8 * 1024 * 1024) {
            return NextResponse.json({ error: "الحد الأقصى 8 ميجا" }, { status: 400 })
        }

        // Sanitize filename to keep the S3 key ASCII-clean
        const ext = file.name.includes(".") ? `.${file.name.split(".").pop()}` : ".pdf"
        let base = transliterate(file.name.replace(/\.[^/.]+$/, "")).replace(/[^a-zA-Z0-9\-_]/g, "_").slice(0, 60)
        if (base.length < 2) base = "document"
        const safeName = `${base}${ext}`

        const result = await uploadToStorage(file, safeName, file.type)
        return NextResponse.json({ url: result.url, key: result.key })
    } catch (err: any) {
        console.error("upload-pdf error:", err)
        return NextResponse.json({ error: err?.message || "خطأ في الخادم" }, { status: 500 })
    }
}
