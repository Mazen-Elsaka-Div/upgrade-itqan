import { redirect } from "next/navigation"
import { getSession, isSuperAdmin } from "@/lib/auth"
import { UserRolesClient } from "./user-roles-client"

export const dynamic = "force-dynamic"

export default async function UserRolesPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!isSuperAdmin(session)) {
    redirect("/admin")
  }
  const { id } = await params
  return <UserRolesClient userId={id} />
}
