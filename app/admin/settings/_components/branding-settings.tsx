import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface BrandingSettingsProps {
  settings: Record<string, any>
  onUpdate: (key: string, value: any) => void
}

export function BrandingSettings({
  settings,
  onUpdate,
}: BrandingSettingsProps) {
  const branding = settings.system_branding_assets || {}

  const handleBrandingChange = (field: string, value: any) => {
    onUpdate("system_branding_assets", {
      ...branding,
      [field]: value,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Branding Assets</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input
              id="logo_url"
              type="url"
              value={branding.logoUrl || ""}
              onChange={(e) => handleBrandingChange("logoUrl", e.target.value)}
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div>
            <Label htmlFor="favicon_url">Favicon URL</Label>
            <Input
              id="favicon_url"
              type="url"
              value={branding.faviconUrl || ""}
              onChange={(e) => handleBrandingChange("faviconUrl", e.target.value)}
              placeholder="https://example.com/favicon.ico"
            />
          </div>

          <div>
            <Label htmlFor="dashboard_logo_url">Dashboard Logo URL</Label>
            <Input
              id="dashboard_logo_url"
              type="url"
              value={branding.dashboardLogoUrl || ""}
              onChange={(e) =>
                handleBrandingChange("dashboardLogoUrl", e.target.value)
              }
              placeholder="https://example.com/logo-dark.png"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
