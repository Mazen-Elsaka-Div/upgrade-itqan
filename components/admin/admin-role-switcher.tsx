"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, GraduationCap, Mic, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type Mode = "super" | "maqraa" | "academy"

const MODES: {
  id: Mode
  label: string
  shortLabel: string
  icon: typeof ShieldCheck
  activeClass: string
  dotClass: string
}[] = [
  {
    id: "super",
    label: "المدير العام",
    shortLabel: "عام",
    icon: ShieldCheck,
    activeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40",
    dotClass: "bg-amber-500",
  },
  {
    id: "maqraa",
    label: "مدير المقرأة",
    shortLabel: "المقرأة",
    icon: Mic,
    activeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40",
    dotClass: "bg-emerald-500",
  },
  {
    id: "academy",
    label: "مدير الأكاديمية",
    shortLabel: "الأكاديمية",
    icon: GraduationCap,
    activeClass: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/40",
    dotClass: "bg-blue-500",
  },
]

// The canonical home page for each mode — where to land after switching.
const MODE_HOME: Record<Mode, string> = {
  super: "/admin",
  maqraa: "/admin",
  academy: "/academy/admin",
}

// Segmented control that lets a Super Admin switch the lens they operate
// the dashboard through. Persisted via /api/admin/mode (POST) then navigates
// to the canonical home page of the chosen mode.
export function AdminRoleSwitcher({
  currentMode,
  collapsed = false,
}: {
  currentMode: Mode
  collapsed?: boolean
}) {
  const router = useRouter()
  const [pending, setPending] = useState<Mode | null>(null)

  async function pickMode(mode: Mode) {
    if (mode === currentMode || pending) return
    setPending(mode)
    try {
      const res = await fetch("/api/admin/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      })
      if (res.ok) {
        // Navigate to the canonical home for this mode instead of refreshing
        // the current page (which may not exist under the new mode).
        router.push(MODE_HOME[mode])
      }
    } finally {
      setPending(null)
    }
  }

  // Collapsed sidebar → show only the active mode's icon with a coloured dot.
  if (collapsed) {
    const active = MODES.find((m) => m.id === currentMode) ?? MODES[0]
    const ActiveIcon = active.icon
    return (
      <TooltipProvider delayDuration={150}>
        <div className="flex flex-col items-center gap-1 w-full px-2">
          {MODES.map((m) => {
            const Icon = m.icon
            const isActive = m.id === currentMode
            const isLoading = pending === m.id
            return (
              <Tooltip key={m.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => pickMode(m.id)}
                    disabled={!!pending}
                    className={cn(
                      "relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200",
                      isActive
                        ? m.activeClass + " shadow-sm"
                        : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    aria-label={m.label}
                    aria-pressed={isActive}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                    {isActive && (
                      <span className={cn("absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-card", m.dotClass)} />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">{m.label}</TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>
    )
  }

  // Expanded sidebar → full segmented control with labels.
  return (
    <div
      dir="rtl"
      className="w-full rounded-xl border border-border bg-muted/40 p-1"
      role="group"
      aria-label="تبديل وضع الإدارة"
    >
      <div className="flex items-center gap-1">
        {MODES.map((m) => {
          const Icon = m.icon
          const isActive = m.id === currentMode
          const isLoading = pending === m.id

          return (
            <button
              key={m.id}
              type="button"
              onClick={() => pickMode(m.id)}
              disabled={!!pending}
              aria-pressed={isActive}
              title={m.label}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border px-1 py-2 text-[10px] font-bold transition-all duration-200",
                isActive
                  ? m.activeClass + " shadow-sm"
                  : "border-transparent text-muted-foreground hover:bg-background hover:text-foreground"
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Icon className="h-4 w-4 shrink-0" />
              )}
              <span className="leading-none">{m.shortLabel}</span>
              {isActive && (
                <span className={cn("absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-card", m.dotClass)} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
