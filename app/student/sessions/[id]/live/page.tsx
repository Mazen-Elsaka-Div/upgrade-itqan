import { HalaqaVideoRoom } from '@/components/video/halaqa-video-room'

export default async function StudentBookingLivePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <HalaqaVideoRoom
      kind="booking"
      refId={id}
      title="جلسة التلاوة"
      subtitle="جلسة فردية مع القارئ"
      exitHref="/student/sessions"
      accent="emerald"
    />
  )
}
