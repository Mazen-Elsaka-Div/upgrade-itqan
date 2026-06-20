'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Pencil,
  ListChecks,
  Users,
} from 'lucide-react'
import { PageLoadingSkeleton } from '@/components/ui/page-loading-skeleton'
import { useI18n } from '@/lib/i18n/context'

type DisplayStatus = 'pending' | 'submitted' | 'graded'

interface TaskRow {
  id: string
  title: string
  description?: string
  type?: string
  status?: string
  course_name?: string
  due_date?: string
  submitted_count: number
  graded_count: number
  total_students: number
}

// Derive a meaningful status from the submission counts so the list reflects
// reality instead of always showing "pending".
function deriveStatus(task: TaskRow): DisplayStatus {
  const submitted = task.submitted_count || 0
  const graded = task.graded_count || 0
  if (task.status === 'graded') return 'graded'
  if (submitted > 0 && graded >= submitted) return 'graded'
  if (submitted > 0) return 'submitted'
  return 'pending'
}

export default function TeacherTasksPage() {
  const { t, locale, dir } = useI18n()
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | DisplayStatus>('all')

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/academy/teacher/tasks')
        if (res.ok) {
          const json = await res.json()
          setTasks(Array.isArray(json) ? json : json.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [])

  if (loading) {
    return <PageLoadingSkeleton />
  }

  const filteredTasks = tasks.filter(t =>
    filter === 'all' ? true : deriveStatus(t) === filter
  )

  const statusColor: Record<DisplayStatus, 'secondary' | 'outline' | 'default'> = {
    pending: 'secondary',
    submitted: 'outline',
    graded: 'default',
  }

  const statusLabel: Record<DisplayStatus, string> = {
    pending: t.teacher.tasks.statusLabels.pending,
    submitted: t.teacher.tasks.statusLabels.submitted,
    graded: t.teacher.tasks.statusLabels.graded,
  }

  const statusIcon: Record<DisplayStatus, React.ReactNode> = {
    pending: <Clock className="w-4 h-4" />,
    submitted: <AlertCircle className="w-4 h-4" />,
    graded: <CheckCircle className="w-4 h-4" />,
  }

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t.teacher.tasks.title}</h1>
        <Link href="/academy/teacher/tasks/new">
          <Button>
            <Plus className="w-4 h-4 ml-2" />
            {t.teacher.tasks.newSuccessBtn}
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'submitted', 'graded'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? t.teacher.tasks.filterAll : statusLabel[f]}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredTasks.map((task) => {
          const ds = deriveStatus(task)
          const isQuiz = task.type === 'quiz'
          return (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{task.title}</h3>
                      <Badge variant={statusColor[ds]}>
                        {statusIcon[ds]}
                        <span className="ml-1">{statusLabel[ds]}</span>
                      </Badge>
                      {isQuiz && (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                          <ListChecks className="w-3.5 h-3.5 ml-1" />
                          {t.teacher.tasks.quizLabel}
                        </Badge>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                    )}
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                      {task.course_name && (
                        <span>{t.teacher.tasks.courseLabel.replace('{course}', task.course_name)}</span>
                      )}
                      {task.due_date && (
                        <span>
                          {t.teacher.tasks.dueDateLabel.replace(
                            '{date}',
                            new Date(task.due_date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')
                          )}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {t.teacher.tasks.submittedCount.replace('{count}', String(task.submitted_count))}
                        {task.graded_count > 0 &&
                          ` · ${t.teacher.tasks.gradedCount.replace('{count}', String(task.graded_count))}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/academy/teacher/tasks/${task.id}/grade`}>
                      <Button size="sm" variant="outline">{t.teacher.tasks.viewSubmissionsBtn}</Button>
                    </Link>
                    <Link href={`/academy/teacher/tasks/${task.id}/edit`}>
                      <Button size="sm" variant="outline">
                        <Pencil className="w-3.5 h-3.5 ml-1" />
                        {t.teacher.tasks.editBtn}
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredTasks.length === 0 && (
        <Card className="text-center py-12">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">{t.teacher.tasks.noTasks}</p>
        </Card>
      )}
    </div>
  )
}
