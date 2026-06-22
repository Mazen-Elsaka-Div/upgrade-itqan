import { useI18n } from '@/lib/i18n/context';
import { HalaqaVideoRoom } from '@/components/video/halaqa-video-room'

export default async function ReaderBookingLivePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <HalaqaVideoRoom
      kind="booking"
      refId={id}
      title={(t.addedTranslations_2026?.['جلسة تلاوة مباشرة'] || (t.addedTranslations_2026?.['جلسة تلاوة مباشرة'] || 'جلسة تلاوة مباشرة'))}
      subtitle={(t.addedTranslations_2026?.['جلسة فردية مع الطالب'] || (t.addedTranslations_2026?.['جلسة فردية مع الطالب'] || 'جلسة فردية مع الطالب'))}
      exitHref="/reader/sessions"
      accent="emerald"
    />
  )
}
