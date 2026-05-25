import { VideoSessionDetail } from '@/components/video/video-session-detail'

export const dynamic = 'force-dynamic'

export default async function MaqraaVideoSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <VideoSessionDetail sessionId={id} backHref="/admin/video-settings" />
}
