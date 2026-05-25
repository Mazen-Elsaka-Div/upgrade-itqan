import { VideoSessionDetail } from '@/components/video/video-session-detail'

export const dynamic = 'force-dynamic'

export default async function AcademyVideoSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <VideoSessionDetail sessionId={id} backHref="/academy/admin/video-settings" />
}
