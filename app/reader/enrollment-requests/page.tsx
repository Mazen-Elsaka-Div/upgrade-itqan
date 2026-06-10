'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  UserPlus, Check, X, Route, BookOpen, Mail, Clock, Inbox,
} from 'lucide-react'
import { toast } from 'sonner'
import { CardListSkeleton } from '@/components/ui/skeletons'

interface EnrollmentRequest {
  enrollment_id: string
  path_type: 'tajweed' | 'memorization'
  path_id: string
  path_title: string
  thumbnail_url: string | null
  status: string
  request_note: string | null
  requested_at: string | null
  student_id: string
  student_name: string
  student_email: string | null
  avatar_url: string | null
}

export default function ReaderEnrollmentRequestsPage() {
  const [requests, setRequests] = useState<EnrollmentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'tajweed' | 'memorization'>('all')

  const load = () => {
    fetch('/api/reader/enrollment-requests')
      .then((r) => r.json())
      .then((j) => setRequests(j.requests || []))
      .catch(() => toast.error('تعذر جلب الطلبات'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filtered = useMemo(
    () => (filter === 'all' ? requests : requests.filter((r) => r.path_type === filter)),
    [requests, filter],
  )

  const counts = useMemo(
    () => ({
      all: requests.length,
      tajweed: requests.filter((r) => r.path_type === 'tajweed').length,
      memorization: requests.filter((r) => r.path_type === 'memorization').length,
    }),
    [requests],
  )

  const handleAction = async (req: EnrollmentRequest, action: 'approve' | 'reject') => {
    setProcessing(req.enrollment_id)
    try {
      const res = await fetch(`/api/reader/enrollment-requests/${req.enrollment_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path_type: req.path_type, action }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'فشل تنفيذ الإجراء')
      toast.success(action === 'approve' ? 'تم قبول الطالب في المسار' : 'تم رفض الطلب')
      setRequests((prev) => prev.filter((r) => r.enrollment_id !== req.enrollment_id))
    } catch (e: any) {
      toast.error(e.message || 'حدث خطأ')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
          <UserPlus className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">طلبات الالتحاق</h1>
          <p className="text-sm text-muted-foreground font-medium">
            راجع وقبول طلبات الطلاب للالتحاق بمساراتك التي تتطلب موافقة
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label="الكل" count={counts.all} />
        <FilterChip active={filter === 'tajweed'} onClick={() => setFilter('tajweed')} label="مسارات التجويد" count={counts.tajweed} />
        <FilterChip active={filter === 'memorization'} onClick={() => setFilter('memorization')} label="مسارات الحفظ" count={counts.memorization} />
      </div>

      {loading ? (
        <CardListSkeleton rows={3} />
      ) : filtered.length > 0 ? (
        <div className="grid gap-4">
          {filtered.map((req) => (
            <Card
              key={req.enrollment_id}
              className="border-border rounded-2xl bg-card overflow-hidden hover:shadow-md transition-shadow"
            >
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-5">
                {/* Student */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {req.avatar_url ? (
                    <img
                      src={req.avatar_url || "/placeholder.svg"}
                      alt={req.student_name}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-border shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xl ring-2 ring-border shrink-0">
                      {req.student_name?.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-bold text-foreground truncate">{req.student_name}</h3>
                    {req.student_email && (
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {req.student_email}
                      </p>
                    )}
                    {req.requested_at && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(req.requested_at).toLocaleDateString('ar-EG')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Path */}
                <div className="flex items-center gap-3 min-w-0 flex-1 md:border-r md:border-border md:pr-5">
                  <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {req.thumbnail_url ? (
                      <img src={req.thumbnail_url || "/placeholder.svg"} alt={req.path_title} className="w-full h-full object-cover" />
                    ) : req.path_type === 'tajweed' ? (
                      <Route className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <BookOpen className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground mb-1">
                      {req.path_type === 'tajweed' ? 'مسار تجويد' : 'مسار حفظ'}
                    </span>
                    <h4 className="font-bold text-sm text-foreground truncate">{req.path_title}</h4>
                    {req.request_note && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{req.request_note}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <Button
                    onClick={() => handleAction(req, 'approve')}
                    disabled={processing === req.enrollment_id}
                    className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="w-4 h-4 ml-1.5" />
                    قبول
                  </Button>
                  <Button
                    onClick={() => handleAction(req, 'reject')}
                    disabled={processing === req.enrollment_id}
                    variant="outline"
                    className="rounded-xl font-bold text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/40 dark:hover:bg-rose-900/20"
                  >
                    <X className="w-4 h-4 ml-1.5" />
                    رفض
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-2 border-border rounded-3xl">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="font-bold text-lg mb-1">لا توجد طلبات معلقة</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              عندما يطلب طالب الالتحاق بأحد مساراتك التي تتطلب موافقة، سيظهر طلبه هنا.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function FilterChip({
  active, onClick, label, count,
}: {
  active: boolean; onClick: () => void; label: string; count: number
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 h-9 rounded-full text-sm font-bold transition-colors ${
        active
          ? 'bg-emerald-600 text-white'
          : 'bg-muted text-muted-foreground hover:bg-muted/70'
      }`}
    >
      {label}
      <span className={`text-xs px-1.5 rounded-full ${active ? 'bg-white/20' : 'bg-background'}`}>{count}</span>
    </button>
  )
}
