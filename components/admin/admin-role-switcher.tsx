"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, GraduationCap, Mic, Check, Loader2, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Mode = "super" | "maqraa" | "academy"

const MODES: { id: Mode; label: string; desc: string; icon: typeof ShieldCheck; dot: string }[] = [
  { id: "super", label: "المدير العام", desc: "تحكم كامل في المنصة", icon: ShieldCheck, dot: "bg-amber-500" },
  { id: "maqraa", label: "مدير المقرأة", desc: "إدارة التلاوة والتسميع", icon: Mic, dot: "bg-emerald-500" },
  { id: "academy", label: "مدير الأكاديمية", desc: "إدارة الدورات والطلاب", icon: GraduationCap, dot: "bg-blue-500" },
]

// Lets a Super Admin switch the lens they operate the dashboard through. The
// choice is persisted in a cookie via /api/admin/mode and the layout re-reads
// it, so the whole shell (and the indicator banner) reflects the active mode.
export function AdminRoleSwitcher({ currentMode }: { currentMode: Mode }) {
  const router = useRouter()
  const [pending, setPending] = useState<Mode | null>(null)

  const active = MODES.find((m) => m.id === currentMode) ?? MODES[0]
  const ActiveIcon = active.icon

  async function pickMode(mode: Mode) {
    if (mode === currentMode) return
    setPending(mode)
    try {
      await fetch("/api/admin/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      })
      router.refresh()
    } finally {
      setPending(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-bold text-foreground transition-colors hover:bg-muted"
          aria-label="تبديل وضع الإدارة"
        >
          <span className={`h-2 w-2 rounded-full ${active.dot}`} />
          <ActiveIcon className="h-4 w-4 text-primary" />
          <span className="hidden sm:inline">{active.label}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64" dir="rtl">
        <DropdownMenuLabel className="text-xs text-muted-foreground">التبديل بين الأوضاع</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {MODES.map((m) => {
          const Icon = m.icon
          const isActive = m.id === currentMode
          return (
            <DropdownMenuItem
              key={m.id}
              onClick={() => pickMode(m.id)}
              className="flex cursor-pointer items-start gap-3 py-2.5"
            >
              <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted`}>
                {pending === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4 text-primary" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 font-bold text-foreground">
                  {m.label}
                  {isActive && <Check className="h-3.5 w-3.5 text-primary" />}
                </span>
                <span className="block text-xs text-muted-foreground">{m.desc}</span>
              </span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
