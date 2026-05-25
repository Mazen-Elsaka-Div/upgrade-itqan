import { VideoSettingsPage } from '@/components/video/video-settings-page'

export const dynamic = 'force-dynamic'

export default function MaqraaVideoSettingsPage() {
  return (
    <VideoSettingsPage
      platform="maqraa"
      sessionsBasePath="/admin/video-settings/sessions"
    />
  )
}
