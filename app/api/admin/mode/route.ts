import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import {
  ADMIN_MODE_COOKIE,
  allowedModesForRole,
  resolveAdminMode,
  type AdminMode,
} from "@/lib/admin/roles"

// GET /api/admin/mode — current effective mode + which modes are available.
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

  const academyRoles = session.academy_roles ?? []
  const allowed = allowedModesForRole(session.role, academyRoles)
  if (allowed.length === 0) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const cookieValue = req.cookies.get(ADMIN_MODE_COOKIE)?.value
  const mode = resolveAdminMode(cookieValue, session.role, academyRoles)

  return NextResponse.json({ mode, allowed, role: session.role })
}

// Shared handler for both PUT and POST — switches the Super Admin's active mode.
// Only Super Admins (role === "admin" | "super_admin") are allowed to switch;
// scoped admins are pinned to their own mode and must never call this.
async function handleModeSwitch(req: NextRequest): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

  // Enforce super_admin at the route level (middleware alone is not enough).
  const isSuperAdmin = session.role === "admin" || session.role === "super_admin"
  if (!isSuperAdmin) {
    return NextResponse.json({ error: "مخصص للمدير العام فقط" }, { status: 403 })
  }

  const academyRoles = session.academy_roles ?? []
  const allowed = allowedModesForRole(session.role, academyRoles)

  const body = await req.json().catch(() => ({}))
  const requested = body?.mode as AdminMode | undefined

  if (!requested || !allowed.includes(requested)) {
    return NextResponse.json({ error: "وضع غير مسموح" }, { status: 400 })
  }

  const res = NextResponse.json({ mode: requested })
  res.cookies.set(ADMIN_MODE_COOKIE, requested, {
    httpOnly: false, // read by the client shell to render the indicator banner
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
  return res
}

// PUT /api/admin/mode
export async function PUT(req: NextRequest) {
  return handleModeSwitch(req)
}

// POST /api/admin/mode — same semantics as PUT; the client components use POST.
export async function POST(req: NextRequest) {
  return handleModeSwitch(req)
}
