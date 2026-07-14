"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Loader2 } from "lucide-react"
import { isMaqraaAdmin } from "@/lib/auth"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch session")
  return res.json()
}

export default function MaqraahAdminSettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { data: session, isLoading, error } = useSWR("/api/internal/user-status", fetcher)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (isLoading) return

    if (!session || !isMaqraaAdmin(session)) {
      router.push("/login")
      return
    }

    setIsAuthorized(true)
  }, [session, isLoading, router])

  if (isLoading || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <>{children}</>
}
