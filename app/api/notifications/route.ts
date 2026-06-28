import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

// GET /api/notifications
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 10
    const offset = (page - 1) * limit

    const notifications = await query(
      `SELECT id, type, title, message, category, COALESCE(link, action_url) as link, is_read, created_at,
              related_recitation_id, related_booking_id
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [session.sub, limit + 1, offset] // Fetch one extra to check if there are more
    )

    const unreadCountRow = await query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`,
      [session.sub]
    )
    const unreadCount = parseInt((unreadCountRow as any)[0]?.count || '0')

    const hasMore = notifications.length > limit
    const paginatedNotifications = notifications.slice(0, limit)

    return NextResponse.json({
      notifications: paginatedNotifications,
      unreadCount,
      hasMore
    })
  } catch (error) {
    console.error("Get notifications error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}

// PATCH /api/notifications — mark ALL as read
export async function PATCH() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    await query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
      [session.sub]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mark notifications error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}

// DELETE /api/notifications — delete ALL for the user
export async function DELETE() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    await query(
      `DELETE FROM notifications WHERE user_id = $1`,
      [session.sub]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete notifications error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
