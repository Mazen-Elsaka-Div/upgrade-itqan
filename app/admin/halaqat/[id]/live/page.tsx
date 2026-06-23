const t: any = new Proxy({}, { get: () => new Proxy({}, { get: () => undefined }) });
import { useI18n } from '@/lib/i18n/context';
import { HalaqaVideoRoom } from '@/components/video/halaqa-video-room'

export const dynamic = 'force-dynamic'

export default async function MaqraaAdminHalaqaLivePage({
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
      subtitle={(t.addedTranslations_2026?.['إدارة المقرأة'] || (t.addedTranslations_2026?.['إدارة المقرأة'] || 'إدارة المقرأة'))}
      exitHref={`/admin/halaqat/${id}`}
      accent="emerald"
    />
  )
}
