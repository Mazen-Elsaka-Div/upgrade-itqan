import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"

// GET /api/admin/contact-academy_messages
export async function GET(req: NextRequest) {
    const session = await getSession()
    if (!session || !requireRole(session, ["admin"])) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    try {
        const academy_messages = await query(
            `SELECT * FROM contact_academy_messages ORDER BY created_at DESC`
        )
        return NextResponse.json({ academy_messages })
    } catch (error) {
        console.error("Admin contact academy_messages GET error:", error)
        return NextResponse.json({ error: "حدث خطأ في جلب الرسائل" }, { status: 500 })
    }
}

// PATCH /api/admin/contact-academy_messages
export async function PATCH(req: NextRequest) {
    const session = await getSession()
    if (!session || !requireRole(session, ["admin"])) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    try {
        const { id, status } = await req.json()
        if (!id || !status) {
            return NextResponse.json({ error: "id and status are required" }, { status: 400 })
        }

        await query(
            `UPDATE contact_academy_messages SET status = $1, updated_at = NOW() WHERE id = $2`,
            [status, id]
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Admin contact academy_messages PATCH error:", error)
        return NextResponse.json({ error: "حدث خطأ في تحديث الرسالة" }, { status: 500 })
    }
}

// DELETE /api/admin/contact-academy_messages
export async function DELETE(req: NextRequest) {
    const session = await getSession()
    if (!session || !requireRole(session, ["admin"])) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")
        if (!id) {
            return NextResponse.json({ error: "id is required" }, { status: 400 })
        }

        await query(`DELETE FROM contact_academy_messages WHERE id = $1`, [id])

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Admin contact academy_messages DELETE error:", error)
        return NextResponse.json({ error: "حدث خطأ في حذف الرسالة" }, { status: 500 })
    }
}
