import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { query } from "@/lib/db"

export async function POST(req: NextRequest) {
    try {
        const { email, code, newPassword } = await req.json()

        if (!email || !code || !newPassword) {
            return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 })
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" },
                { status: 400 }
            )
        }

        const users = await query<{
            id: string
            reset_code: string
            reset_expires_at: string
        }>(
            `SELECT id, reset_code, reset_expires_at FROM users WHERE email = $1 LIMIT 1`,
            [email.toLowerCase()]
        )

        if (users.length === 0) {
            return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 })
        }

        const user = users[0]

        if (!user.reset_code || user.reset_code !== code) {
            return NextResponse.json({ error: "كود التحقق غير صحيح أو غير صالح" }, { status: 400 })
        }

        if (new Date(user.reset_expires_at) < new Date()) {
            return NextResponse.json({ error: "كود التحقق منتهي الصلاحية، يرجى طلب كود جديد" }, { status: 400 })
        }

        const passwordHash = await bcrypt.hash(newPassword, 10)

        await query(
            `UPDATE users SET password_hash = $1, reset_code = NULL, reset_expires_at = NULL, is_locked = false, failed_login_count = 0 WHERE id = $2`,
            [passwordHash, user.id]
        )

        return NextResponse.json(
            { message: "تم تغيير كلمة المرور بنجاح" },
            { status: 200 }
        )
    } catch (error) {
        console.error("Reset password error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
