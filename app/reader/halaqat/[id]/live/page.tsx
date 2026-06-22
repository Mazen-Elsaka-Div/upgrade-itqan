import { useI18n } from '@/lib/i18n/context';
import { HalaqaVideoRoom } from '@/components/video/halaqa-video-room'

export const dynamic = 'force-dynamic'

export default async function ReaderHalaqaLivePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <HalaqaVideoRoom
      kind="halaqa"
      refId={id}
      title={(t.addedTranslations_2026?.['غرفة الحلقة المباشرة'] || (t.addedTranslations_2026?.['غرفة الحلقة المباشرة'] || 'غرفة الحلقة المباشرة'))}
      subtitle={(t.addedTranslations_2026?.['بوابة المقرئ'] || (t.addedTranslations_2026?.['بوابة المقرئ'] || 'بوابة المقرئ'))}
      exitHref={`/reader/halaqat/${id}`}
      accent="emerald"
    />
  )
}
