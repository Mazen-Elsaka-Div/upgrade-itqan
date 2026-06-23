const t: any = new Proxy({}, { get: () => new Proxy({}, { get: () => undefined }) });
const a: any = new Proxy({}, { get: () => new Proxy({}, { get: () => undefined }) });
import { useI18n } from '@/lib/i18n/context';
import { HalaqaVideoRoom } from '@/components/video/halaqa-video-room'

export default async function TeacherSessionLivePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <HalaqaVideoRoom
      kind="course_session"
      refId={id}
      title={(t.addedTranslations_2026?.['جلسة الدرس المباشرة'] || (t.addedTranslations_2026?.['جلسة الدرس المباشرة'] || 'جلسة الدرس المباشرة'))}
      subtitle={(t.addedTranslations_2026?.['بث مباشر للطلاب المسجلين في الدورة'] || (t.addedTranslations_2026?.['بث مباشر للطلاب المسجلين في الدورة'] || 'بث مباشر للطلاب المسجلين في الدورة'))}
      exitHref="/academy/teacher/sessions"
      accent="indigo"
    />
  )
}
