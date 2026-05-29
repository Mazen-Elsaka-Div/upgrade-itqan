import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, Globe2, Link2, Users, FileText, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

async function getSessionDetails(id: string, teacherId: string) {
  const sessions = await query(`
    SELECT 
      cs.*,
      c.title as course_name,
      ls.title as series_title
    FROM course_sessions cs
    JOIN courses c ON cs.course_id = c.id
    LEFT JOIN lesson_series ls ON cs.series_id = ls.id
    WHERE cs.id = $1 AND c.teacher_id = $2
  `, [id, teacherId])

  return sessions[0] || null
}

async function getSessionAttendance(id: string) {
  const attendance = await query(`
    SELECT 
      sa.id,
      sa.joined_at,
      sa.left_at,
      u.name as full_name,
      u.email
    FROM session_attendance sa
    JOIN users u ON sa.student_id = u.id
    WHERE sa.session_id = $1
    ORDER BY sa.joined_at ASC
  `, [id])

  return attendance
}

export default async function SessionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const authSession = await getSession()
  if (!authSession || !['teacher', 'academy_admin'].includes(authSession.role)) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">غير مصرح لك بالوصول لهذه الصفحة</p>
      </div>
    )
  }

  const { id } = await params
  const sessionDetails = await getSessionDetails(id, authSession.sub)

  if (!sessionDetails) {
    notFound()
  }

  const attendance = await getSessionAttendance(id)

  const isCompleted = sessionDetails.status === 'completed'
  const isActive = sessionDetails.status === 'in_progress'

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{sessionDetails.title}</h1>
          <p className="text-muted-foreground">{sessionDetails.course_name}</p>
        </div>
        <div>
          <Badge variant={isCompleted ? 'secondary' : isActive ? 'default' : 'outline'} className={isActive ? 'bg-green-600' : ''}>
            {isCompleted ? 'مكتملة' : isActive ? 'نشطة حالياً' : 'مجدولة'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">تفاصيل الجلسة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {sessionDetails.description && (
              <div className="space-y-2">
                <div className="flex items-center text-sm font-medium text-muted-foreground">
                  <FileText className="w-4 h-4 ml-2" />
                  وصف الجلسة
                </div>
                <p className="text-sm bg-muted/30 p-3 rounded-lg leading-relaxed">
                  {sessionDetails.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 ml-2" />
                  التاريخ
                </div>
                <p className="font-medium">
                  {new Date(sessionDetails.scheduled_at).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 ml-2" />
                  الوقت والمدة
                </div>
                <p className="font-medium">
                  {new Date(sessionDetails.scheduled_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  <span className="text-muted-foreground text-sm mx-2">({sessionDetails.duration_minutes} دقيقة)</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Globe2 className="w-4 h-4 ml-2" />
                  نوع الجلسة
                </div>
                <p className="font-medium">
                  {sessionDetails.is_public ? 'عامة (متاحة للجميع)' : 'خاصة بطلاب الدورة'}
                </p>
              </div>
              {sessionDetails.series_title && (
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                    السلسلة
                  </div>
                  <p className="font-medium">{sessionDetails.series_title}</p>
                </div>
              )}
            </div>

            {sessionDetails.meeting_link && (
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Link2 className="w-4 h-4 ml-2" />
                  رابط الاجتماع ({sessionDetails.meeting_platform})
                </div>
                <a 
                  href={sessionDetails.meeting_link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:underline text-sm break-all"
                >
                  {sessionDetails.meeting_link}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Users className="w-5 h-5 ml-2" />
              سجل الحضور
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attendance.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4 pb-4 border-b">
                  إجمالي الحضور: <strong className="text-foreground">{attendance.length}</strong> طلاب
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {attendance.map((record: any) => (
                    <div key={record.id} className="flex flex-col space-y-1 p-2 hover:bg-muted/50 rounded-md transition-colors">
                      <span className="font-medium text-sm">{record.full_name}</span>
                      <span className="text-xs text-muted-foreground">{record.email}</span>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                        <span>انضم: {new Date(record.joined_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                        {record.left_at && (
                          <span>• غادر: {new Date(record.left_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-20" />
                لم يتم تسجيل أي حضور لهذه الجلسة حتى الآن.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
