import { HalaqaVideoRoom } from '@/components/video/halaqa-video-room'
import { useI18n } from "@/lib/i18n/context";

export default async function StudentSessionLivePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
    const { t } = useI18n();
  const { id } = await params
  return (
    <HalaqaVideoRoom
      kind="course_session"
      refId={id}
      title={t.addedTranslations_2026?.['درس مباشر'] || 'درس مباشر'}
      subtitle={t.addedTranslations_2026?.['انضم إلى الدرس المباشر'] || 'انضم إلى الدرس المباشر'}
      exitHref="/academy/student/sessions"
      accent="indigo"
    />
  )
}
