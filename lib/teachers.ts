/**
 * Helpers for working with academy teachers.
 *
 * A teacher is considered "assignable" — i.e. they may be assigned as
 * the owner / instructor of academy content (courses, halaqat, series,
 * archived content, paths, etc.) — only when ALL of the following hold:
 *
 *   - role               = 'teacher'
 *   - approval_status    = 'approved'
 *   - is_active          = true
 *
 * Anything else (pending_approval, rejected, suspended/deactivated) MUST
 * NOT be selectable when an academy admin assigns a teacher to content.
 *
 * Use {@link assertTeacherAssignable} on the server before persisting any
 * teacher_id supplied by the admin UI so the rule is enforced even if a
 * client somehow sends a stale / forged id.
 */

import { queryOne } from './db'

export const ASSIGNABLE_TEACHER_SQL = `
  u.role = 'teacher'
  AND u.approval_status = 'approved'
  AND COALESCE(u.is_active, TRUE) = TRUE
`

export type TeacherAssignmentError =
  | { ok: true }
  | { ok: false; reason: 'not_found' | 'not_approved' | 'inactive'; message: string }

/**
 * Confirm a teacher id is safe to assign to academy content.
 *
 * Returns `{ ok: true }` if the user exists, has role = teacher,
 * approval_status = approved, and is_active = true. Otherwise returns
 * `{ ok: false, reason, message }` with an Arabic message that can be
 * surfaced to the admin.
 */
export async function assertTeacherAssignable(
  teacherId: string,
): Promise<TeacherAssignmentError> {
  const row = await queryOne<{
    id: string
    approval_status: string | null
    is_active: boolean | null
  }>(
    `SELECT id, approval_status, COALESCE(is_active, TRUE) AS is_active
       FROM users
      WHERE id = $1 AND role = 'teacher'
      LIMIT 1`,
    [teacherId],
  )

  if (!row) {
    return {
      ok: false,
      reason: 'not_found',
      message: 'المدرس غير موجود',
    }
  }

  if (row.approval_status !== 'approved') {
    return {
      ok: false,
      reason: 'not_approved',
      message:
        'لا يمكن تعيين هذا المدرس — حسابه ليس موافقاً عليه (قيد المراجعة أو مرفوض).',
    }
  }

  if (row.is_active === false) {
    return {
      ok: false,
      reason: 'inactive',
      message: 'لا يمكن تعيين هذا المدرس — حسابه موقوف/غير نشط.',
    }
  }

  return { ok: true }
}
