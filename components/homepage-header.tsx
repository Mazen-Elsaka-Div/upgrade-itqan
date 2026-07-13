import { getSession, isAnyAdmin, getAcademyRole } from "@/lib/auth"
import HeaderNavClient from "./homepage-header-client"

export default async function HomepageHeader() {
  const session = await getSession()

  // Determine where to route the user if they're logged in
  let dashboardLink: string | null = null
  let dashboardText: string | null = null

  if (session) {
    if (isAnyAdmin(session)) {
      // Admins go to /admin
      dashboardLink = "/admin"
      dashboardText = "لوحة التحكم"
    } else {
      // Check for academy role
      const academyRole = getAcademyRole(session)
      if (academyRole) {
        // Academy users go to /academy
        dashboardLink = "/academy"
        dashboardText = "الأكاديمية"
      } else {
        // Regular users go to their profile/dashboard
        dashboardLink = "/dashboard"
        dashboardText = "حسابي"
      }
    }
  }

  return (
    <HeaderNavClient 
      isLoggedIn={!!session}
      dashboardLink={dashboardLink}
      dashboardText={dashboardText}
      userName={session?.name}
    />
  )
}
