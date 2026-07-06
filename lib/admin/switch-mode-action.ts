"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import {
  ADMIN_MODE_COOKIE,
  allowedModesForRole,
  type AdminMode,
} from "@/lib/admin/roles"

/**
 * Server Action to switch the super admin's active mode.
 * Faster than fetch API because it runs server-side and redirects atomically.
 * No network round-trip delay, no router.push() overhead.
 */
export async function switchAdminMode(mode: AdminMode) {
  const session = await getSession()
  if (!session) {
    throw new Error("غير مصرح")
  }

  // Enforce super_admin only
  const isSuperAdmin = session.role === "admin" || session.role === "super_admin"
  if (!isSuperAdmin) {
    throw new Error("مخصص للمدير العام فقط")
  }

  const academyRoles = session.academy_roles ?? []
  const allowed = allowedModesForRole(session.role, academyRoles)

  if (!mode || !allowed.includes(mode)) {
    throw new Error("وضع غير مسموح")
  }

  // Set the cookie server-side (atomic, no client involvement)
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_MODE_COOKIE, mode, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })

  // Navigate to the home page of this mode (atomic redirect, no router.push() on client)
  const modeHome: Record<AdminMode, string> = {
    super: "/admin",
    maqraa: "/admin",
    academy: "/academy/admin",
  }

  redirect(modeHome[mode])
}
