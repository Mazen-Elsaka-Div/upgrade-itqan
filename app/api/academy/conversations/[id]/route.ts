import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { queryOne, query } from "@/lib/db"

// DELETE a conversation (or support ticket) that belongs to the current user.
// academy_messages are removed automatically via ON DELETE CASCADE.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  const { id } = await params

  try {
    const conv = await queryOne<{
      id: string
      student_id: string | null
      teacher_id: string | null
      parent_id: string | null
      admin_id: string | null
    }>(
      `SELECT id, student_id, teacher_id, parent_id, admin_id
         FROM academy_conversations WHERE id = $1`,
      [id]
    )

    if (!conv) {
      return NextResponse.json({ error: "المحادثة غير موجودة" }, { status: 404 })
    }

    // Only a participant (or an admin) may delete the conversation.
    const isParticipant =
      conv.student_id === session.sub ||
      conv.teacher_id === session.sub ||
      conv.parent_id === session.sub ||
      conv.admin_id === session.sub ||
      session.role === "admin" ||
      session.role === "supervisor"

    if (!isParticipant) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }

    await query(`DELETE FROM academy_conversations WHERE id = $1`, [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Conversation DELETE error:", error)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
