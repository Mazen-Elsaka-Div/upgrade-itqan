import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ContactSettingsProps {
  settings: Record<string, any>
  onUpdate: (key: string, value: any) => void
}

export function ContactSettings({
  settings,
  onUpdate,
}: ContactSettingsProps) {
  const contact = settings.system_contact_info || {}
  const social = contact.social || {}

  const handleContactChange = (field: string, value: any) => {
    onUpdate("system_contact_info", {
      ...contact,
      [field]: value,
    })
  }

  const handleSocialChange = (platform: string, value: string) => {
    handleContactChange("social", {
      ...social,
      [platform]: value,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="contact_email">Email</Label>
            <Input
              id="contact_email"
              type="email"
              value={contact.email || ""}
              onChange={(e) => handleContactChange("email", e.target.value)}
              placeholder="contact@example.com"
            />
          </div>

          <div>
            <Label htmlFor="contact_phone">Phone</Label>
            <Input
              id="contact_phone"
              value={contact.phone || ""}
              onChange={(e) => handleContactChange("phone", e.target.value)}
              placeholder="+966 55 1234567"
            />
          </div>

          <div>
            <Label htmlFor="contact_address">Address</Label>
            <Input
              id="contact_address"
              value={contact.address || ""}
              onChange={(e) => handleContactChange("address", e.target.value)}
              placeholder="الرياض، المملكة العربية السعودية"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Social Media Links</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="twitter">Twitter</Label>
            <Input
              id="twitter"
              type="url"
              value={social.twitter || ""}
              onChange={(e) => handleSocialChange("twitter", e.target.value)}
              placeholder="https://twitter.com/example"
            />
          </div>

          <div>
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              type="url"
              value={social.instagram || ""}
              onChange={(e) => handleSocialChange("instagram", e.target.value)}
              placeholder="https://instagram.com/example"
            />
          </div>

          <div>
            <Label htmlFor="facebook">Facebook</Label>
            <Input
              id="facebook"
              type="url"
              value={social.facebook || ""}
              onChange={(e) => handleSocialChange("facebook", e.target.value)}
              placeholder="https://facebook.com/example"
            />
          </div>

          <div>
            <Label htmlFor="youtube">YouTube</Label>
            <Input
              id="youtube"
              type="url"
              value={social.youtube || ""}
              onChange={(e) => handleSocialChange("youtube", e.target.value)}
              placeholder="https://youtube.com/channel/example"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
