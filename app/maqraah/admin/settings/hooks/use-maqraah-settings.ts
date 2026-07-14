"use client"

import useSWR, { mutate } from "swr"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/context"

export interface MaqraahSettings {
  [key: string]: any
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error("Failed to fetch settings")
    throw error
  }
  return res.json()
}

export function useMaqraahSettings() {
  const { t } = useI18n()
  const [saving, setSaving] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({})

  // Fetch maqraah settings
  const { data, error, isLoading } = useSWR(
    "/api/maqraah/admin/settings",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  )

  const settings: MaqraahSettings = {
    ...(data?.settings?.reduce((acc: any, s: any) => {
      acc[s.setting_key] = s.setting_value
      return acc
    }, {}) || {}),
    ...pendingChanges,
  }

  const metadata: Record<string, any> = data?.settings?.reduce(
    (acc: any, s: any) => {
      acc[s.setting_key] = {
        type: s.setting_type,
        updatedAt: s.updated_at,
        description: s.description,
      }
      return acc
    },
    {}
  ) || {}

  const hasUnsavedChanges = Object.keys(pendingChanges).length > 0

  const updateSettings = useCallback(
    (key: string, value: any) => {
      setPendingChanges((prev) => ({
        ...prev,
        [key]: value,
      }))
    },
    []
  )

  const saveChanges = useCallback(async () => {
    if (Object.keys(pendingChanges).length === 0) {
      toast.info(t.common?.noChanges || "No changes to save")
      return
    }

    setSaving(true)
    try {
      const updates = Object.entries(pendingChanges).map(
        ([key, value]) => ({
          setting_key: key,
          setting_value: value,
          setting_type: key.split("_").slice(0, 2).join("_"),
        })
      )

      for (const update of updates) {
        const res = await fetch("/api/maqraah/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(update),
        })

        if (!res.ok) {
          throw new Error(`Failed to save ${update.setting_key}`)
        }
      }

      toast.success(t.common?.saved || "Settings saved successfully")
      setPendingChanges({})
      mutate("/api/maqraah/admin/settings")
    } catch (error: any) {
      console.error("[useMaqraahSettings] Save error:", error)
      toast.error(error.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }, [pendingChanges, t])

  const discardChanges = useCallback(() => {
    setPendingChanges({})
    toast.info(t.common?.discarded || "Changes discarded")
  }, [t])

  return {
    settings,
    metadata,
    isLoading,
    error,
    saving,
    hasUnsavedChanges,
    updateSettings,
    saveChanges,
    discardChanges,
  }
}
