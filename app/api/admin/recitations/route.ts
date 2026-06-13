import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"
import { logAdminAction } from "@/lib/activity-log"
import { createNotification } from "@/lib/notifications"
import { resolveSupervisorScope } from "@/lib/supervisor-scope"

// GET /api/admin/recitations - list all recitations with filters
export async function GET(req: NextRequest) {
    try {
        const session = await getSession()
        const allowedRoles: ("admin" | "student_supervisor" | "reciter_supervisor")[] = ["admin", "student_supervisor", "reciter_supervisor"]
        if (!requireRole(session, allowedRoles)) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const search = searchParams.get("search")
        const readerName = searchParams.get("reader")
        const status = searchParams.get("status")
        const unassigned = searchParams.get("unassigned")

        let whereClause = "WHERE 1=1"
        const params: any[] = []

        if (unassigned === "true") {
            whereClause += ` AND r.assigned_reader_id IS NULL AND r.status = 'pending'`
        }

        if (search) {
            params.push(`%${search}%`)
            whereClause += ` AND (u.name ILIKE $${params.length} OR r.id::text ILIKE $${params.length})`
        }

        if (readerName) {
            params.push(readerName)
            whereClause += ` AND r.assigned_reader_id = $${params.length}`
        }

        if (status) {
            params.push(status)
            whereClause += ` AND r.status = $${params.length}`
        }

        // Scoped permissions: restrict supervisors to their assigned users.
        // student_supervisor -> recitations of assigned students (r.student_id)
        // reciter_supervisor -> recitations assigned to their readers (r.assigned_reader_id)
        if (session!.role === 'student_supervisor' || session!.role === 'reciter_supervisor') {
            const scope = await resolveSupervisorScope(session!)
            if (scope.kind === 'ids') {
                params.push(scope.ids)
                if (session!.role === 'student_supervisor') {
                    whereClause += ` AND r.student_id = ANY($${params.length}::uuid[])`
                } else {
                    whereClause += ` AND r.assigned_reader_id = ANY($${params.length}::uuid[])`
                }
            }
        }

        const recitations = await query(
            `SELECT 
         r.id, 
         r.surah_name as "surah", 
         r.student_id as "studentId",
         u.name as "studentName", 
         u.email as "studentEmail",
         r.status, 
         r.created_at as "createdAt",
         r.assigned_reader_id as "assignedReaderId",
         reader.name as "assignedReaderName",
         r.ayah_from as "fromAyah",
         r.ayah_to as "toAyah",
         bk.reader_id as "sessionReaderId",
         session_reader.name as "sessionReaderName",
         bk.status as "bookingStatus",
         bk.slot_start as "bookingSlotStart"
       FROM recitations r
       JOIN users u ON u.id = r.student_id
       LEFT JOIN users reader ON reader.id = r.assigned_reader_id
       LEFT JOIN bookings bk ON bk.recitation_id = r.id
       LEFT JOIN users session_reader ON session_reader.id = bk.reader_id
       ${whereClause}
       ORDER BY r.created_at DESC`,
            params
        )

        return NextResponse.json({ recitations })
    } catch (error) {
        console.error("Admin recitations error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}

// PATCH /api/admin/recitations - Reassign reader
export async function PATCH(req: NextRequest) {
    try {
        const session = await getSession()
        const allowedRoles: ("admin" | "student_supervisor" | "reciter_supervisor")[] = ["admin", "student_supervisor", "reciter_supervisor"]
        if (!requireRole(session, allowedRoles)) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
        }

        const { recitationId, readerId } = await req.json()

        if (!recitationId) {
            return NextResponse.json({ error: "معرف التلاوة مطلوب" }, { status: 400 })
        }

        // Get full recitation details before updating (including old reader)
        const recitationRows = await query(
            `SELECT r.id, r.surah_name, r.ayah_from, r.ayah_to, r.status, r.assigned_reader_id,
                    u.name as student_name, u.email as student_email
             FROM recitations r
             JOIN users u ON u.id = r.student_id
             WHERE r.id = $1`,
            [recitationId]
        )
        const recitation = (recitationRows as any)[0]

        if (!recitation) {
            return NextResponse.json({ error: "التلاوة غير موجودة" }, { status: 404 })
        }

        const oldReaderId = recitation.assigned_reader_id
        const isActuallyChanging = oldReaderId !== (readerId || null)

        // ── 1. Update the recitation: new reader + reset status to pending ──
        await query(
            `UPDATE recitations 
             SET assigned_reader_id = $1,
                 assigned_at = NOW(),
                 status = 'pending',
                 reviewed_at = NULL
             WHERE id = $2`,
            [readerId || null, recitationId]
        )

        // ── 2. Clean up old review data (only if actually reassigning) ──
        if (isActuallyChanging && oldReaderId) {
            // Delete old review record
            await query(
                `DELETE FROM reviews WHERE recitation_id = $1`,
                [recitationId]
            )

            // Delete old word mistakes
            await query(
                `DELETE FROM word_mistakes WHERE recitation_id = $1`,
                [recitationId]
            )

            // Cancel pending reserved_slot for the old reader linked to this recitation
            const oldSlots = await query(
                `SELECT id, reader_id FROM reserved_slots 
                 WHERE recitation_id = $1 AND reader_id = $2 AND status = 'pending'`,
                [recitationId, oldReaderId]
            )

            if ((oldSlots as any[]).length > 0) {
                await query(
                    `UPDATE reserved_slots SET status = 'cancelled', updated_at = NOW()
                     WHERE recitation_id = $1 AND reader_id = $2 AND status = 'pending'`,
                    [recitationId, oldReaderId]
                )

                // Restore old reader's reserved slot count
                await query(
                    `UPDATE reader_profiles 
                     SET current_reserved_slots = GREATEST(0, current_reserved_slots - 1)
                     WHERE user_id = $1`,
                    [oldReaderId]
                )
            }

            // ── 3. Notify old reader that recitation was taken from them ──
            const surahInfo = `${recitation.surah_name} (${recitation.ayah_from}-${recitation.ayah_to})`
            try {
                await createNotification({
                    userId: oldReaderId,
                    type: "recitation_reassigned",
                    title: "تم نقل تلاوة من قائمتك",
                    message: `تم نقل تلاوة الطالب ${recitation.student_name || 'غير معروف'} (${surahInfo}) وإسنادها لمقرئ آخر.`,
                    category: "recitation",
                    link: `/reader/recitations`,
                    relatedRecitationId: recitationId
                })
            } catch (notifError) {
                console.error("Failed to notify old reader:", notifError)
            }
        }

        // ── 4. Notify new reader ──
        if (readerId && readerId !== oldReaderId) {
            const surahInfo = `${recitation.surah_name} (${recitation.ayah_from}-${recitation.ayah_to})`
            try {
                await createNotification({
                    userId: readerId,
                    type: "recitation_received",
                    title: "تم تعيينك لتقييم تلاوة جديدة",
                    message: `تم تعيينك لتقييم تلاوة الطالب ${recitation.student_name || 'غير معروف'}: ${surahInfo}`,
                    category: "recitation",
                    link: `/reader/recitations`,
                    relatedRecitationId: recitationId
                })
            } catch (notifError) {
                console.error("Failed to notify new reader:", notifError)
            }
        }

        // ── 5. Log the admin action ──
        await logAdminAction({
            userId: session!.sub,
            action: 'recitation_reassigned',
            entityType: 'recitation',
            entityId: recitationId,
            description: `Admin reassigned recitation from reader ${oldReaderId || 'unassigned'} to ${readerId || 'unassigned'}. Previous review data cleared.`,
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Admin reassign error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
