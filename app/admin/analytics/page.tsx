import { redirect } from "next/navigation"
import { getSession, isSuperAdmin } from "@/lib/auth"
import { PlatformOverviewClient } from "./platform-overview-client"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  const session = await getSession()
  if (!isSuperAdmin(session)) {
    redirect("/admin")
  }
  return <PlatformOverviewClient />
}
