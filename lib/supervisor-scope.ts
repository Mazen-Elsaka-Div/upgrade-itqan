import { query } from "@/lib/db"
import type { JWTPayload } from "@/lib/auth"

/**
 * Scoped supervisor permissions.
 *
 * Supervisors (student_supervisor / reciter_supervisor) can be assigned a
 * specific set of students/readers via the `supervisor_assignments` table.
 *
 * Rules:
 * - If a supervisor has NO active assignments, they see ALL users in their
 *   scope (student_supervisor -> all students, reciter_supervisor -> all readers).
 *   This keeps existing accounts working unchanged.
 * - If a supervisor HAS active assignments, they are restricted to ONLY the
 *   assigned user ids.
 *
 * `scope_type` values used:
 *   - 'student'  -> scope_value is a student user id
 *   - 'reader'   -> scope_value is a reader user id
 */

export type SupervisorScope =
  | { kind: "all" }                 // no restriction
  | { kind: "ids"; ids: string[] }  // restricted to these user ids
  | { kind: "none" }                // assigned but empty (should not normally happen)

/** The base role a supervisor manages. */
export function supervisorBaseRole(role: string): "student" | "reader" | null {
  if (role === "student_supervisor") return "student"
  if (role === "reciter_supervisor") return "reader"
  return null
}

/**
 * Returns the list of user ids a supervisor is assigned to manage.
 * Returns an empty array if no assignments exist.
 */
export async function getAssignedUserIds(
  supervisorId: string,
  scopeType: "student" | "reader"
): Promise<string[]> {
  const rows = await query<{ scope_value: string }>(
    `SELECT scope_value FROM supervisor_assignments
     WHERE supervisor_id = $1 AND scope_type = $2 AND is_active = true`,
    [supervisorId, scopeType]
  )
  return rows.map((r) => r.scope_value).filter(Boolean)
}

/**
 * Resolve the data scope for the current session.
 * For admins (or non-supervisor roles) it returns { kind: 'all' }.
 */
export async function resolveSupervisorScope(
  session: JWTPayload
): Promise<SupervisorScope> {
  const baseRole = supervisorBaseRole(session.role)
  if (!baseRole) return { kind: "all" } // admin / others: unrestricted
  const ids = await getAssignedUserIds(session.sub, baseRole)
  if (ids.length === 0) return { kind: "all" } // no assignments -> see all
  return { kind: "ids", ids }
}

/**
 * Check whether a supervisor is allowed to act on a specific target user id.
 */
export async function canSupervisorAccessUser(
  session: JWTPayload,
  targetUserId: string
): Promise<boolean> {
  const scope = await resolveSupervisorScope(session)
  if (scope.kind === "all") return true
  if (scope.kind === "ids") return scope.ids.includes(targetUserId)
  return false
}

/**
 * Check whether a supervisor is allowed to act on a specific recitation.
 * - student_supervisor is matched against the recitation's student_id
 * - reciter_supervisor is matched against the recitation's assigned_reader_id
 */
export async function canSupervisorAccessRecitation(
  session: JWTPayload,
  recitationId: string
): Promise<boolean> {
  const scope = await resolveSupervisorScope(session)
  if (scope.kind === "all") return true
  if (scope.kind !== "ids") return false

  const rows = await query<{ student_id: string; assigned_reader_id: string | null }>(
    `SELECT student_id, assigned_reader_id FROM recitations WHERE id = $1`,
    [recitationId]
  )
  const rec = rows[0]
  if (!rec) return false

  const targetId =
    session.role === "student_supervisor" ? rec.student_id : rec.assigned_reader_id
  return targetId ? scope.ids.includes(targetId) : false
}
