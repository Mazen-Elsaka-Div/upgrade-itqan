"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Settings,
  Globe,
  Shield,
  Wrench,
  Mail,
  Palette,
  Phone,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"
import { useSystemSettings } from "./hooks/use-system-settings"
import {
  GeneralSettings,
  MaintenanceSettings,
  SecuritySettings,
  EmailSettings,
  BrandingSettings,
  ContactSettings,
  HomepageSettings,
} from "./_components"

const getTabs = (a: any) => [
  {
    id: "general",
    label: a.setTabGeneral || "General",
    icon: Globe,
    prefix: "system_general_",
  },
  {
    id: "maintenance",
    label: a.setTabMaintenance || "Maintenance",
    icon: Wrench,
    prefix: "system_maintenance_",
  },
  {
    id: "security",
    label: a.setTabSecurity || "Security",
    icon: Shield,
    prefix: "system_security_",
  },
  {
    id: "email",
    label: a.setTabEmail || "Email",
    icon: Mail,
    prefix: "system_email_",
  },
  {
    id: "branding",
    label: a.setTabBranding || "Branding",
    icon: Palette,
    prefix: "system_branding_",
  },
  {
    id: "contact",
    label: a.setTabContact || "Contact",
    icon: Phone,
    prefix: "system_contact_",
  },
  {
    id: "homepage",
    label: a.setTabHomepage || "Homepage",
    icon: Settings,
    prefix: "system_homepage_",
  },
]

export default function SystemAdminSettingsPage() {
  const { t, locale } = useI18n()
  const a = t.admin || {}
  const tabs = getTabs(a)

  const {
    settings,
    metadata,
    isLoading,
    saving,
    hasUnsavedChanges,
    updateSettings,
    saveChanges,
    discardChanges,
  } = useSystemSettings()

  const [activeTab, setActiveTab] = useState("general")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        if (hasUnsavedChanges) saveChanges()
      }
      if (e.key === "Escape") {
        if (hasUnsavedChanges) discardChanges()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [hasUnsavedChanges, saveChanges, discardChanges])

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <GeneralSettings
            settings={settings}
            metadata={metadata}
            onUpdate={updateSettings}
          />
        )
      case "maintenance":
        return (
          <MaintenanceSettings
            settings={settings}
            onUpdate={updateSettings}
          />
        )
      case "security":
        return (
          <SecuritySettings settings={settings} onUpdate={updateSettings} />
        )
      case "email":
        return <EmailSettings settings={settings} onUpdate={updateSettings} />
      case "branding":
        return (
          <BrandingSettings settings={settings} onUpdate={updateSettings} />
        )
      case "contact":
        return <ContactSettings settings={settings} onUpdate={updateSettings} />
      case "homepage":
        return (
          <HomepageSettings settings={settings} onUpdate={updateSettings} />
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="border-b p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">
              {a.systemSettingsTitle || "System Settings"}
            </h1>
          </div>
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-amber-600">
                {a.unsavedChanges || "Unsaved changes"}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={discardChanges}
                disabled={saving}
              >
                {a.discard || "Discard"}
              </Button>
              <Button
                size="sm"
                onClick={saveChanges}
                disabled={saving}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {a.save || "Save"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="m-4 md:m-6 border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          {a.systemSettingsHint ||
            "These settings apply to the entire platform. Changes affect all modules."}
        </AlertDescription>
      </Alert>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Tabs */}
        <div
          className={cn(
            "border-r bg-muted/50 p-4",
            isMobile ? "hidden" : "w-48"
          )}
        >
          <ScrollArea className="h-full">
            <div className="space-y-2 pr-4">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Mobile Tab Selector */}
        {isMobile && (
          <div className="border-b p-2">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full rounded-lg border bg-background p-2 text-sm"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Content Area */}
        <ScrollArea className="flex-1">
          <div className="p-4 md:p-6">
            {renderTabContent()}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
