import { Suspense } from 'react'
import { PageLoadingSkeleton } from '@/components/ui/page-loading-skeleton'
import { TeacherSessionsHub } from '@/components/academy/teacher/sessions-hub'

export default function TeacherSessionsPage() {
  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <TeacherSessionsHub />
    </Suspense>
  )
}
