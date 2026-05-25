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
      title="جلسة الدرس المباشرة"
      subtitle="بث مباشر للطلاب المسجلين في الدورة"
      exitHref="/academy/teacher/sessions"
      accent="indigo"
    />
  )
}
