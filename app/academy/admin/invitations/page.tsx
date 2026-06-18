'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Mail, UserPlus, Upload, RefreshCw, XCircle, CheckCircle,
  Clock, Search, ChevronLeft, ChevronRight, Send, FileText,
  AlertCircle, Loader2, BookOpen, Users, Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { useI18n } from '@/lib/i18n/context'

interface Invitation {
  id: string
  email: string
  invited_name: string | null
  role_to_assign: string
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED'
  expires_at: string
  created_at: string
  accepted_at: string | null
  resent_at: string | null
  resent_count: number
  inviter_name: string | null
  plan_title: string | null
  batch_id: string | null
}

interface Counts {
  PENDING: number; ACCEPTED: number; EXPIRED: number; CANCELLED: number; ALL: number
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function AdminInvitationsPage() {
  const { t, locale } = useI18n()
  const a = t.academyAdmin
  const dateLocale = locale === 'ar' ? 'ar-EG' : 'en-US'

  const ROLES = [
    { value: 'academy_student',   label: a.adminStudents || 'Student' },
    { value: 'teacher',           label: a.adminTeachers || 'Teacher' },
    { value: 'parent',            label: a.adminParents || 'Parent' },
    { value: 'fiqh_supervisor',   label: a.fiqhOfficers || 'Fiqh Supervisor' },
    { value: 'content_supervisor',label: a.adminContentSupervisor || 'Content Supervisor' },
  ]

  const STATUS_META: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    PENDING:   { label: a.invPendingLabel,  cls: 'bg-amber-500/10 text-amber-700 border-amber-500/20',      icon: <Clock      className="w-3 h-3" /> },
    ACCEPTED:  { label: a.invAcceptedLabel, cls: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20', icon: <CheckCircle className="w-3 h-3" /> },
    EXPIRED:   { label: a.invExpiredLabel,  cls: 'bg-muted text-muted-foreground border-border',             icon: <XCircle    className="w-3 h-3" /> },
    CANCELLED: { label: a.invCancelledLabel,cls: 'bg-red-500/10 text-red-700 border-red-500/20',             icon: <XCircle    className="w-3 h-3" /> },
  }

  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [formEmail, setFormEmail] = useState('')
  const [formName, setFormName] = useState('')
  const [formRole, setFormRole] = useState('academy_student')
  const [formPlan, setFormPlan] = useState('none')
  const [sending, setSending] = useState(false)
  const [showCsv, setShowCsv] = useState(false)
  const [csvRole, setCsvRole] = useState('academy_student')
  const [csvPlan, setCsvPlan] = useState('none')
  const [csvRows, setCsvRows] = useState<Array<{ email: string; name?: string }>>([])
  const [csvError, setCsvError] = useState('')
  const [csvSending, setCsvSending] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  const { data: plansData } = useSWR('/api/academy/admin/courses?limit=100', fetcher)
  const plans: Array<{ id: string; title: string }> = plansData?.data || []

  const swrKey = `/api/academy/admin/invitations?status=${tab}&search=${encodeURIComponent(search)}&page=${page}`
  const { data, mutate, isLoading } = useSWR(swrKey, fetcher, { refreshInterval: 30000 })
  const invitations: Invitation[] = data?.data   || []
  const counts: Counts            = data?.counts || { PENDING: 0, ACCEPTED: 0, EXPIRED: 0, CANCELLED: 0, ALL: 0 }

  async function handleSend() {
    if (!formEmail) { toast.error(a.invEmailRequired); return }
    setSending(true)
    try {
      const res = await fetch('/api/academy/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formEmail, invited_name: formName || undefined, role: formRole, plan_id: formPlan !== 'none' ? formPlan : undefined }),
      })
      const json = await res.json()
      if (!res.ok && res.status !== 207) {
        toast.error(json.error || a.invError)
      } else {
        const sent = json.sent?.[0]
        if (sent?.emailSent === false) {
          toast.warning(a.invInvitationSaved.replace('{email}', formEmail))
        } else {
          toast.success(a.invInvitationSent.replace('{email}', formEmail))
        }
        setShowForm(false); setFormEmail(''); setFormName(''); setFormRole('academy_student'); setFormPlan('none'); mutate()
      }
    } catch { toast.error(a.invError) }
    finally { setSending(false) }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvError('')
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
      const rows: Array<{ email: string; name?: string }> = []
      const bad: string[] = []
      for (const line of lines) {
        const [email, name] = line.split(',').map(s => s.trim())
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          bad.push(email || a.invEmptyEmail)
        } else {
          rows.push({ email, name: name || undefined })
        }
      }
      if (bad.length) setCsvError(a.invInvalidEmails.replace('{emails}', bad.join(', ')))
      setCsvRows(rows)
    }
    reader.readAsText(file)
  }

  async function handleCsvSend() {
    if (!csvRows.length) return
    setCsvSending(true)
    try {
      const res = await fetch('/api/academy/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: csvRows.map(r => ({ email: r.email, invited_name: r.name || undefined, role: csvRole, plan_id: csvPlan !== 'none' ? csvPlan : undefined })) }),
      })
      const json = await res.json()
      const sentCount = json.sent?.length  || 0
      const errCount  = json.errors?.length || 0
      if (sentCount > 0) toast.success(a.invInvitationsSent.replace('{count}', String(sentCount)))
      if (errCount  > 0) toast.error(a.invInvitationsFailed.replace('{count}', String(errCount)))
      setShowCsv(false); setCsvRows([]); setCsvError('')
      if (fileRef.current) fileRef.current.value = ''
      mutate()
    } catch { toast.error(a.invError) }
    finally { setCsvSending(false) }
  }

  async function handleResend(id: string) {
    setActionId(id)
    try {
      const res = await fetch(`/api/academy/admin/invitations/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'resend' }) })
      if (res.ok) { toast.success(a.invResentSuccess); mutate() }
      else        { toast.error(a.invResendFailed) }
    } finally { setActionId(null) }
  }

  async function handleCancel(id: string) {
    setActionId(id)
    try {
      const res = await fetch(`/api/academy/admin/invitations/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'cancel' }) })
      if (res.ok) { toast.success(a.invCancelSuccess); mutate() }
      else        { toast.error(a.invCancelFailed) }
    } finally { setActionId(null) }
  }

  async function handleDelete(id: string) {
    if (!confirm(a.invDeleteConfirm)) return
    setActionId(id)
    try {
      const res = await fetch(`/api/academy/admin/invitations/${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success(a.invDeleteSuccess); mutate() }
      else        { toast.error(a.invDeleteFailed) }
    } finally { setActionId(null) }
  }

  const tabs = [
    { key: 'all',       label: a.invAll,       count: counts.ALL },
    { key: 'PENDING',   label: a.invPending,    count: counts.PENDING },
    { key: 'ACCEPTED',  label: a.invAccepted,   count: counts.ACCEPTED },
    { key: 'EXPIRED',   label: a.invExpired,    count: counts.EXPIRED },
    { key: 'CANCELLED', label: a.invCancelled,  count: counts.CANCELLED },
  ]

  const tableHeaders = [a.invEmail, a.invName, a.invRole, a.invPlan, a.invStatus, a.invDates, a.invActions]

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">{a.invTitle}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{a.invDesc}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-2xl gap-2 h-10" onClick={() => setShowCsv(true)}>
            <Upload className="w-4 h-4" /> {a.invUploadCsv}
          </Button>
          <Button className="rounded-2xl gap-2 h-10" onClick={() => setShowForm(true)}>
            <UserPlus className="w-4 h-4" /> {a.invNewInvitation}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: a.invTotal,  value: counts.ALL,       cls: 'text-foreground' },
          { label: a.invPending,  value: counts.PENDING,   cls: 'text-amber-600' },
          { label: a.invAccepted, value: counts.ACCEPTED,  cls: 'text-emerald-600' },
          { label: a.invExpired,  value: counts.EXPIRED + counts.CANCELLED, cls: 'text-muted-foreground' },
        ].map(s => (
          <Card key={s.label} className="rounded-2xl border-border/50">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-black ${s.cls}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex gap-1 bg-muted/50 p-1 rounded-2xl w-fit flex-wrap">
          {tabs.map(t => (
            <button key={t.key} type="button" onClick={() => { setTab(t.key); setPage(1) }}
              className={`px-3 py-1.5 text-sm font-bold rounded-xl transition-colors flex items-center gap-1.5 ${tab === t.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {t.label} <span className="text-xs opacity-60">{t.count}</span>
            </button>
          ))}
        </div>
        <div className="relative md:max-w-xs flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={a.invSearchPlaceholder} value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="pr-9 rounded-2xl" />
        </div>
      </div>

      <Card className="rounded-3xl border-border/50 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : invitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Mail className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="font-bold text-foreground">{a.invNoInvitations}</p>
            <p className="text-muted-foreground text-sm mt-1">{a.invSendFirst}</p>
            <Button className="mt-4 rounded-2xl gap-2" onClick={() => setShowForm(true)}>
              <UserPlus className="w-4 h-4" /> {a.invNewInvitation}
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/50 bg-muted/30">
                <tr className="text-right">
                  {tableHeaders.map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-bold text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {invitations.map(inv => {
                  const meta = STATUS_META[inv.status]
                  const isBusy = actionId === inv.id
                  return (
                    <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{inv.email}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{inv.invited_name || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs font-medium text-foreground">{ROLES.find(r => r.value === inv.role_to_assign)?.label || inv.role_to_assign}</span>
                      </td>
                      <td className="px-4 py-3">
                        {inv.plan_title
                          ? <span className="text-xs bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit"><BookOpen className="w-3 h-3" />{inv.plan_title}</span>
                          : <span className="text-muted-foreground text-xs">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant="outline" className={`gap-1 text-xs ${meta?.cls}`}>{meta?.icon}{meta?.label}</Badge>
                        {inv.resent_count > 0 && <span className="ms-1.5 text-[10px] text-muted-foreground">{a.invResentCount.replace('{count}', String(inv.resent_count))}</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                        <div>{a.invSent} {new Date(inv.created_at).toLocaleDateString(dateLocale)}</div>
                        {inv.accepted_at
                          ? <div className="text-emerald-600">{a.invAcceptedDate} {new Date(inv.accepted_at).toLocaleDateString(dateLocale)}</div>
                          : <div>{a.invExpires} {new Date(inv.expires_at).toLocaleDateString(dateLocale)}</div>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {(inv.status === 'PENDING' || inv.status === 'EXPIRED' || inv.status === 'CANCELLED') && (
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs rounded-xl gap-1 whitespace-nowrap" disabled={isBusy} onClick={() => handleResend(inv.id)}>
                              {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                              {a.invResend}
                            </Button>
                          )}
                          {inv.status === 'PENDING' && (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs rounded-xl text-amber-600 hover:text-amber-700 hover:bg-amber-600/10" disabled={isBusy} onClick={() => handleCancel(inv.id)}>
                              {a.invCancel}
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10" disabled={isBusy} onClick={() => handleDelete(inv.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {invitations.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/30">
            <span className="text-xs text-muted-foreground">{a.invPage.replace('{page}', String(page))}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="rounded-xl h-7 w-7 p-0" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronRight className="w-3.5 h-3.5" /></Button>
              <Button size="sm" variant="outline" className="rounded-xl h-7 w-7 p-0" disabled={invitations.length < 20} onClick={() => setPage(p => p + 1)}><ChevronLeft className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary" />{a.invNewInvitationTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">{a.invEmailLabel}</Label>
              <Input type="email" dir="ltr" placeholder="example@email.com" value={formEmail} onChange={e => setFormEmail(e.target.value)} className="rounded-2xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">{a.invNameLabel}</Label>
              <Input placeholder={a.invNamePlaceholder} value={formName} onChange={e => setFormName(e.target.value)} className="rounded-2xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">{a.invRoleLabel}</Label>
                <Select value={formRole} onValueChange={setFormRole}>
                  <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">{a.invPlanLabel}</Label>
                <Select value={formPlan} onValueChange={setFormPlan}>
                  <SelectTrigger className="rounded-2xl"><SelectValue placeholder={a.invNoPlan} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{a.invNoPlan}</SelectItem>
                    {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-xl px-3 py-2">{a.invEmailNote}</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-2xl" onClick={() => setShowForm(false)}>{t.cancel}</Button>
            <Button className="rounded-2xl gap-2" disabled={sending} onClick={handleSend}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {a.invSendInvitation}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCsv} onOpenChange={v => { setShowCsv(v); if (!v) { setCsvRows([]); setCsvError('') } }}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2"><Upload className="w-5 h-5 text-primary" />{a.invCsvBatchTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors" onClick={() => fileRef.current?.click()}>
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground">{a.invClickToSelect}</p>
              <p className="text-xs text-muted-foreground mt-1">{a.invCsvFormat}<code className="bg-muted px-1 rounded font-mono text-[11px]">email,name</code>{a.invNameOptional}</p>
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
            </div>
            {csvRows.length > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3">
                <p className="text-sm font-bold text-emerald-700">{a.invEmailsReady.replace('{count}', String(csvRows.length))}</p>
                <p className="text-xs text-emerald-600 mt-1">{csvRows.slice(0, 4).map(r => r.email).join('  •  ')}{csvRows.length > 4 ? ` ${a.invAndOthers}` : ''}</p>
              </div>
            )}
            {csvError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-3 flex gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><p>{csvError}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">{a.invRoleLabel}</Label>
                <Select value={csvRole} onValueChange={setCsvRole}>
                  <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">{a.invPlanLabel}</Label>
                <Select value={csvPlan} onValueChange={setCsvPlan}>
                  <SelectTrigger className="rounded-2xl"><SelectValue placeholder={a.invNoPlan} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{a.invNoPlan}</SelectItem>
                    {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-2xl" onClick={() => { setShowCsv(false); setCsvRows([]); setCsvError('') }}>{t.cancel}</Button>
            <Button className="rounded-2xl gap-2" disabled={!csvRows.length || csvSending} onClick={handleCsvSend}>
              {csvSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {a.invSending.replace('{count}', String(csvRows.length))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
