import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const academy_messages = await query(
        `SELECT m.id, m.message_text, m.message_type, m.attachment_url,
       m.is_read, m.created_at,
       u.name AS sender_name, u.role AS sender_role
     FROM academy_messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.conversation_id = $1
     ORDER BY m.created_at ASC`,
        [id]
    )

    const convo = await query(
        `SELECT c.id, c.is_active,
       s.name AS student_name, r.name AS teacher_name
     FROM academy_conversations c
     JOIN users s ON c.student_id = s.id
     JOIN users r ON c.teacher_id = r.id
     WHERE c.id = $1`,
        [id]
    )

    return NextResponse.json({ conversation: convo[0], academy_messages })
}
