import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface GeneralSettingsProps {
  settings: Record<string, any>
  metadata: Record<string, any>
  onUpdate: (key: string, value: any) => void
}

export function GeneralSettings({
  settings,
  metadata,
  onUpdate,
}: GeneralSettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Site Information</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="site_name">Site Name</Label>
            <Input
              id="site_name"
              value={settings.system_general_site_name || ""}
              onChange={(e) =>
                onUpdate("system_general_site_name", e.target.value)
              }
              placeholder="e.g., Itqan Platform"
            />
          </div>

          <div>
            <Label htmlFor="site_tagline">Site Tagline</Label>
            <Input
              id="site_tagline"
              value={settings.system_general_site_tagline || ""}
              onChange={(e) =>
                onUpdate("system_general_site_tagline", e.target.value)
              }
              placeholder="e.g., Master the Quran"
            />
          </div>

          <div>
            <Label htmlFor="app_url">Application URL</Label>
            <Input
              id="app_url"
              type="url"
              value={settings.system_general_app_url || ""}
              onChange={(e) =>
                onUpdate("system_general_app_url", e.target.value)
              }
              placeholder="https://example.com"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="contact_email">Contact Email</Label>
            <Input
              id="contact_email"
              type="email"
              value={settings.system_general_contact_email || ""}
              onChange={(e) =>
                onUpdate("system_general_contact_email", e.target.value)
              }
              placeholder="support@example.com"
            />
          </div>

          <div>
            <Label htmlFor="contact_phone">Contact Phone</Label>
            <Input
              id="contact_phone"
              value={settings.system_general_contact_phone || ""}
              onChange={(e) =>
                onUpdate("system_general_contact_phone", e.target.value)
              }
              placeholder="+966 55 1234567"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Regional Settings</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={settings.system_general_timezone || "Asia/Riyadh"}
              onValueChange={(value) =>
                onUpdate("system_general_timezone", value)
              }
            >
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Riyadh">Asia/Riyadh (UTC+3)</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="Asia/Dubai">Asia/Dubai (UTC+4)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="language">Default Language</Label>
            <Select
              value={settings.system_general_language || "ar"}
              onValueChange={(value) =>
                onUpdate("system_general_language", value)
              }
            >
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">Arabic (العربية)</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
