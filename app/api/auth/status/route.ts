import { NextResponse } from "next/server"
import { getSession, isAnyAdmin, getAcademyRole } from "@/lib/auth"

export async function GET() {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ authenticated: false })
    }

    // Compute where the user should be routed from the homepage header.
    let dashboardLink = "/dashboard"
    let dashboardText = "حسابي"
    if (isAnyAdmin(session)) {
        dashboardLink = "/admin"
        dashboardText = "لوحة التحكم"
    } else if (getAcademyRole(session)) {
        dashboardLink = "/academy"
        dashboardText = "الأكاديمية"
    }

    return NextResponse.json({
        authenticated: true,
        user: {
            role: session.role,
            name: session.name
        },
        dashboardLink,
        dashboardText
    })
}
