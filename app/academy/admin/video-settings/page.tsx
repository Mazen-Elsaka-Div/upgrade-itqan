import { VideoSettingsPage } from '@/components/video/video-settings-page'

export const dynamic = 'force-dynamic'

export default function AcademyVideoSettingsPage() {
  return (
    <VideoSettingsPage
      platform="academy"
      sessionsBasePath="/academy/admin/video-settings/sessions"
    />
  )
}
