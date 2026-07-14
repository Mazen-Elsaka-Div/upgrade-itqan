"use client"

import { useState, useEffect } from "react"
import {
  Settings,
  Globe,
  Shield,
  Wrench,
  Mail,
  Bell,
  Search,
  Save,
  Loader2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useSystemSettings } from "./hooks/use-system-settings"
import {
  IdentitySettings,
  EmailSettings,
  SecuritySettings,
  NotificationsSettings,
  MaintenanceSettings,
  SeoSettings,
} from "./_components"

const TABS = [
  { id: "identity",      label: "هوية المنصة",        icon: Globe,     description: "الاسم والشعار وبيانات التواصل" },
  { id: "email",         label: "البريد الإلكتروني",  icon: Mail,      description: "إعدادات SMTP والإرسال" },
  { id: "security",      label: "الأمان والخصوصية",   icon: Shield,    description: "الجلسات والتحقق وسجلات النشاط" },
  { id: "notifications", label: "الإشعارات",           icon: Bell,      description: "إشعارات البريد التلقائية" },
  { id: "maintenance",   label: "الصيانة",             icon: Wrench,    description: "وضع الصيانة ونطاق تطبيقه" },
  { id: "seo",           label: "SEO",                 icon: Search,    description: "بيانات محركات البحث" },
] as const

type TabId = (typeof TABS)[number]["id"]

export default function SystemSettingsPage() {
  const {
    settings,
    isLoading,
    saving,
    hasUnsavedChanges,
    pendingCount,
    updateSettings,
    saveChanges,
    discardChanges,
  } = useSystemSettings()

  const [activeTab, setActiveTab] = useState<TabId>("identity")
  const [isMobile, setIsMobile]   = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        if (hasUnsavedChanges) saveChanges()
      }
      if (e.key === "Escape" && hasUnsavedChanges) discardChanges()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [hasUnsavedChanges, saveChanges, discardChanges])

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      )
    }

    const props = { settings, onUpdate: updateSettings }

    switch (activeTab) {
      case "identity":      return <IdentitySettings      {...props} />
      case "email":         return <EmailSettings         {...props} />
      case "security":      return <SecuritySettings      {...props} />
      case "notifications": return <NotificationsSettings {...props} />
      case "maintenance":   return <MaintenanceSettings   {...props} />
      case "seo":           return <SeoSettings           {...props} />
      default:              return null
    }
  }

  const activeTabMeta = TABS.find((t) => t.id === activeTab)

  return (
    <div className="flex h-full flex-col bg-background -mx-6 lg:-mx-8 -mt-6 lg:-mt-8">

      {/* ─── Header ─────────────────────────────────── */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-none">إعدادات النظام</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {activeTabMeta?.description}
            </p>
          </div>
        </div>

        {hasUnsavedChanges && (
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="hidden sm:flex border-amber-300 bg-amber-50 text-amber-700"
            >
              {pendingCount} تعديل غير محفوظ
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={discardChanges}
              disabled={saving}
            >
              <X className="h-3.5 w-3.5 ml-1" />
              تجاهل
            </Button>
            <Button size="sm" onClick={saveChanges} disabled={saving}>
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin ml-1" />
              ) : (
                <Save className="h-3.5 w-3.5 ml-1" />
              )}
              حفظ
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ─── Desktop Sidebar ─────────────────────── */}
        {!isMobile && (
          <aside className="w-56 shrink-0 border-l bg-muted/30">
            <ScrollArea className="h-full">
              <nav className="space-y-0.5 p-3">
                {TABS.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        activeTab === tab.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </ScrollArea>
          </aside>
        )}

        {/* ─── Mobile Selector ─────────────────────── */}
        {isMobile && (
          <div className="w-full border-b px-4 py-2">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as TabId)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            >
              {TABS.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ─── Content ─────────────────────────────── */}
        <ScrollArea className="flex-1">
          <div className="max-w-3xl p-6">
            {renderContent()}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
