import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { createNotification } from "@/lib/notifications"
import { sendSessionReminderEmail } from "@/lib/email"
import { isCronAuthorized } from "@/lib/cron-auth"

// You can call this route using a cron job (e.g. Vercel Cron)
// e.g. every hour: 0 * * * *
export async function GET(req: NextRequest) {
    try {
        if (!isCronAuthorized(req)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        // Find all bookings scheduled in the next 24 hours
        // that are confirmed and haven't had a reminder sent yet
        const bookingsParams = await query<{
            id: string
            student_id: string
            student_name: string
            student_email: string
            reader_name: string
            slot_start: string
            meeting_link: string
        }>(
            `SELECT b.id, b.student_id, s.name as student_name, s.email as student_email,
              r.name as reader_name, b.scheduled_at as slot_start, b.meeting_link
       FROM bookings b
       JOIN users s ON s.id = b.student_id
       JOIN users r ON r.id = b.reader_id
       WHERE b.status = 'confirmed' 
         AND b.reminder_sent_at IS NULL
         AND b.scheduled_at > NOW() 
         AND b.scheduled_at <= NOW() + INTERVAL '24 hours'`
        )

        let sentCount = 0

        for (const booking of bookingsParams) {
            const { id, student_id, student_name, student_email, reader_name, slot_start, meeting_link } = booking

            // Skip if there's no meeting link yet
            if (!meeting_link) continue

            const slotDate = new Date(slot_start)
            const sessionDate = slotDate.toLocaleDateString("ar-SA", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
            })
            const sessionTime = slotDate.toLocaleTimeString("ar-SA", {
                hour: "2-digit", minute: "2-digit",
            })

            // Send email reminder
            await sendSessionReminderEmail(
                student_email,
                student_name,
                reader_name,
                sessionDate,
                sessionTime,
                meeting_link
            ).catch(err => console.error(`[Cron] Failed to send reminder email to ${student_email}:`, err))

            // Create in-app notification
            await createNotification({
                userId: student_id,
                type: "session_reminder",
                title: "تذكير بالجلسة ⏰",
                message: `جلسة التسميع الخاصة بك مع ${reader_name} ستبدأ خلال 24 ساعة.`,
                category: "session",
                link: `/student/sessions`,
                relatedBookingId: id,
            })

            // Mark reminder as sent
            await query(`UPDATE bookings SET reminder_sent_at = NOW() WHERE id = $1`, [id])

            sentCount++
        }

        return NextResponse.json({ success: true, sentCount, processedBookings: bookingsParams.length })
    } catch (error: any) {
        console.error("[Cron Reminders] Error:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
