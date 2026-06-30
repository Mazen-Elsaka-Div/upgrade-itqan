import { redirect } from "next/navigation"
import { getSession, isSuperAdmin } from "@/lib/auth"
import { RoleManagementClient } from "./role-management-client"

export const dynamic = "force-dynamic"

export default async function RoleManagementPage() {
  const session = await getSession()
  if (!isSuperAdmin(session)) {
    redirect("/admin")
  }
  return <RoleManagementClient />
}
