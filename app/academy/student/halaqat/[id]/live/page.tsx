import { HalaqaVideoRoom } from '@/components/video/halaqa-video-room'
import { useI18n } from "@/lib/i18n/context";

export const dynamic = 'force-dynamic'

export default async function AcademyStudentHalaqaLivePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
    const { t } = useI18n();
  const { id } = await params
  return (
    <HalaqaVideoRoom
      kind="halaqa"
      refId={id}
      title={t.addedTranslations_2026?.['غرفة الحلقة المباشرة'] || 'غرفة الحلقة المباشرة'}
      subtitle={t.addedTranslations_2026?.['بوابة الطالب'] || 'بوابة الطالب'}
      exitHref={`/academy/student/halaqat/${id}`}
      accent="indigo"
    />
  )
}
