'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Users,
  Check,
  X,
  Loader2,
  UserCheck,
  Clock,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Link2Off,
  Heart,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { toast } from 'sonner'

interface ParentRequest {
  id: string
  parent_id: string
  parent_name: string
  parent_email: string
  parent_avatar: string | null
  relation: string
  status: string
  created_at: string
}

interface LinkedParent {
  link_id: string
  parent_id: string
  name: string
  email: string
  phone: string | null
  city: string | null
  gender: string | null
  avatar_url: string | null
  relation: string
  linked_since: string
}

interface Sibling {
  student_id: string
  name: string
  avatar_url: string | null
  gender: string | null
  relation: string
  parent_name: string
}

const relationLabels: Record<string, { ar: string; en: string }> = {
  father: { ar: 'الأب', en: 'Father' },
  mother: { ar: 'الأم', en: 'Mother' },
  guardian: { ar: 'ولي الأمر', en: 'Guardian' },
  other: { ar: 'آخر', en: 'Other' },
}

export function FamilyCenter() {
  const { locale } = useI18n()
  const isAr = locale === 'ar'

  const [requests, setRequests] = useState<ParentRequest[]>([])
  const [parents, setParents] = useState<LinkedParent[]>([])
  const [siblings, setSiblings] = useState<Sibling[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [unlinkTarget, setUnlinkTarget] = useState<LinkedParent | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/student/family')
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests || [])
        setParents(data.parents || [])
        setSiblings(data.siblings || [])
      }
    } catch (error) {
      console.error('Failed to fetch family data:', error)
    } finally {
      setLoading(false)
    }
  }

  const rel = (r: string) => relationLabels[r]?.[isAr ? 'ar' : 'en'] || r

  const handleAction = async (requestId: string, action: 'approve' | 'reject' | 'unlink') => {
    setActionLoading(requestId)
    try {
      const res = await fetch('/api/student/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, action }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        await fetchData()
      } else {
        toast.error(data.error || (isAr ? 'حدث خطأ' : 'An error occurred'))
      }
    } catch {
      toast.error(isAr ? 'حدث خطأ في الاتصال' : 'Connection error')
    } finally {
      setActionLoading(null)
      setUnlinkTarget(null)
    }
  }

  const pendingRequests = requests.filter((r) => r.status?.toLowerCase() === 'pending')
  const rejectedRequests = requests.filter((r) => r.status?.toLowerCase() === 'rejected')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-balance">
          {isAr ? 'ولي الأمر والعائلة' : 'Guardian & Family'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAr
            ? 'راجع طلبات ربط أولياء الأمور، واطّلع على بيانات ولي أمرك وإخوتك المسجلين.'
            : 'Review guardian link requests and view your guardian and registered siblings.'}
        </p>
      </div>

      {/* 1) Pending parent link requests */}
      {pendingRequests.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <CardTitle className="text-lg">{isAr ? 'طلبات ربط في الانتظار' : 'Pending Link Requests'}</CardTitle>
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                {pendingRequests.length}
              </Badge>
            </div>
            <CardDescription>
              {isAr ? 'هذه الطلبات تحتاج إلى موافقتك أو رفضك' : 'These requests need your approval or rejection'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex flex-col gap-4 rounded-xl border border-amber-200/50 bg-background p-5 shadow-sm dark:border-amber-900/50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-2 border-primary/10">
                    <AvatarImage src={request.parent_avatar || undefined} />
                    <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">
                      {request.parent_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-lg font-bold">{request.parent_name}</p>
                    <p className="text-sm text-muted-foreground">{request.parent_email}</p>
                    <Badge variant="outline" className="mt-2 font-semibold">
                      {rel(request.relation)}
                    </Badge>
                  </div>
                </div>
                <div className="mt-2 flex w-full gap-3 sm:mt-0 sm:w-auto">
                  <Button
                    onClick={() => handleAction(request.id, 'approve')}
                    disabled={actionLoading === request.id}
                    className="h-11 flex-1 gap-2 rounded-xl bg-green-600 px-6 font-bold text-white hover:bg-green-700 sm:flex-none"
                  >
                    {actionLoading === request.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    {isAr ? 'قبول' : 'Approve'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleAction(request.id, 'reject')}
                    disabled={actionLoading === request.id}
                    className="h-11 flex-1 gap-2 rounded-xl border-rose-200 px-6 font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900 dark:hover:bg-rose-900/20 sm:flex-none"
                  >
                    {actionLoading === request.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                    {isAr ? 'رفض' : 'Reject'}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 2) Linked guardians data */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">{isAr ? 'بيانات ولي الأمر' : 'Guardian Details'}</CardTitle>
            {parents.length > 0 && (
              <Badge variant="secondary">{parents.length}</Badge>
            )}
          </div>
          <CardDescription>
            {isAr ? 'أولياء الأمور المرتبطون بحسابك حالياً.' : 'Guardians currently linked to your account.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {parents.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="max-w-md text-muted-foreground">
                {isAr
                  ? 'لا يوجد ولي أمر مرتبط بحسابك بعد. عند قبولك لطلب ربط، ستظهر بياناته هنا.'
                  : 'No guardian is linked yet. Once you approve a link request, their details will appear here.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {parents.map((p) => (
                <div key={p.link_id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-primary/10">
                        <AvatarImage src={p.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 font-bold text-primary">
                          {p.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold">{p.name}</p>
                        <Badge variant="outline" className="mt-1 font-semibold">
                          {rel(p.relation)}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUnlinkTarget(p)}
                      className="gap-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-900/20"
                    >
                      <Link2Off className="h-4 w-4" />
                      <span className="sr-only sm:not-sr-only">{isAr ? 'إلغاء الربط' : 'Unlink'}</span>
                    </Button>
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="truncate">{p.email}</span>
                    </div>
                    {p.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4 shrink-0" />
                        <span dir="ltr">{p.phone}</span>
                      </div>
                    )}
                    {p.city && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span>{p.city}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3) Siblings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">{isAr ? 'الإخوة' : 'Siblings'}</CardTitle>
            {siblings.length > 0 && <Badge variant="secondary">{siblings.length}</Badge>}
          </div>
          <CardDescription>
            {isAr
              ? 'الطلاب الآخرون المرتبطون بنفس ولي الأمر.'
              : 'Other students linked to the same guardian.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {siblings.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Heart className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="max-w-md text-muted-foreground">
                {isAr
                  ? 'لا يوجد إخوة مسجلون مرتبطون بنفس ولي أمرك.'
                  : 'No registered siblings linked to your guardian.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {siblings.map((s) => (
                <div key={s.student_id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                  <Avatar className="h-11 w-11 border-2 border-primary/10">
                    <AvatarImage src={s.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 font-bold text-primary">{s.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {isAr ? `عبر ${s.parent_name}` : `via ${s.parent_name}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History (rejected) */}
      {rejectedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{isAr ? 'سجل الطلبات' : 'Request History'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rejectedRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={request.parent_avatar || undefined} />
                      <AvatarFallback className="bg-primary/10 text-sm text-primary">
                        {request.parent_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{request.parent_name}</p>
                      <p className="text-xs text-muted-foreground">{rel(request.relation)}</p>
                    </div>
                  </div>
                  <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    {isAr ? 'مرفوض' : 'Rejected'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">{isAr ? 'ملاحظة مهمة' : 'Important Note'}</p>
              <p className="mt-1 text-blue-700 dark:text-blue-300">
                {isAr
                  ? 'عند قبول طلب ولي الأمر، سيتمكن من متابعة تقدمك الدراسي ودرجاتك. يمكنك إلغاء الربط في أي وقت.'
                  : 'When you approve a guardian request, they can track your academic progress and grades. You can unlink at any time.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unlink confirmation */}
      <AlertDialog open={!!unlinkTarget} onOpenChange={(open) => !open && setUnlinkTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? 'إلغاء الربط؟' : 'Unlink guardian?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? `سيتم إلغاء ربط حسابك بـ ${unlinkTarget?.name}. لن يتمكن بعدها من متابعة تقدمك.`
                : `This will unlink your account from ${unlinkTarget?.name}. They will no longer be able to track your progress.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? 'تراجع' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => unlinkTarget && handleAction(unlinkTarget.link_id, 'unlink')}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {isAr ? 'تأكيد الإلغاء' : 'Confirm unlink'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
