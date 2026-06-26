import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { createNotification } from "@/lib/notifications"
import { isCronAuthorized } from "@/lib/cron-auth"

// GET /api/cron/check-expirations - Background job to handle slot timeouts
export async function GET(req: NextRequest) {
  try {
    if (!isCronAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 1. Find expired reservations
    const expiredReservations = await query<{
      id: string
      student_id: string
      reader_id: string
      recitation_id: string
    }>(
      `SELECT id, student_id, reader_id, recitation_id 
       FROM reserved_slots 
       WHERE status = 'pending' AND expires_at < NOW()`
    )

    if (expiredReservations.length === 0) {
      return NextResponse.json({ message: "No expired reservations found" })
    }

    for (const res of expiredReservations) {
      // 2. Mark reservation as expired
      await query(
        `UPDATE reserved_slots SET status = 'expired', updated_at = NOW() WHERE id = $1`,
        [res.id]
      )

      // 3. Decrement reserved count for reader
      await query(
        `UPDATE reader_profiles SET current_reserved_slots = GREATEST(0, current_reserved_slots - 1) WHERE user_id = $1`,
        [res.reader_id]
      )

      // 4. Suspend student
      await query(
        `UPDATE users SET student_status = 'suspended', suspended_at = NOW(), suspension_reason = 'انتهت مهلة 3 أيام لاختيار موعد الجلسة' WHERE id = $1`,
        [res.student_id]
      )

      // 5. Notify student
      await createNotification({
        userId: res.student_id,
        type: 'needs_session', // Reusing type or could add 'student_suspended'
        title: 'تم تعليق حسابك مؤقتاً ⚠️',
        message: 'انتهت مهلة اختيار الموعد (3 أيام). يمكنك طلب موعد جديد من المقرئ لتفعيل حسابك.',
        category: 'account',
        link: '/student',
      })
    }

    return NextResponse.json({ 
      message: `Processed ${expiredReservations.length} expired reservations`,
      ids: expiredReservations.map(r => r.id)
    })
  } catch (error) {
    console.error("Cron check-expirations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
