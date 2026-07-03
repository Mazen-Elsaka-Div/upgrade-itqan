'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Shield, Activity, Search, ChevronLeft, ChevronRight, RefreshCw, Download } from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

const fetcher = (url: string) => fetch(url).then(r => r.json())

// ─── Audit Log (Governance) ───────────────────────────────────────────────────

interface AuditEntry {
  id: string
  action: string
  platform: 'maqraa' | 'academy' | 'site'
  entity_type: string | null
  entity_id: string | null
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
  actor_name: string | null
  actor_email: string | null
  actor_email_resolved: string | null
}

const PLATFORM_LABELS: Record<string, string> = {
  maqraa: 'المقرأة',
  academy: 'الأكاديمية',
  site: 'الموقع',
}

const PLATFORM_COLORS: Record<string, string> = {
  maqraa:  'bg-emerald-100 text-emerald-800',
  academy: 'bg-blue-100 text-blue-800',
  site:    'bg-purple-100 text-purple-800',
}

function AuditLogTab() {
  const [platform, setPlatform] = useState('all')
  const [action,   setAction]   = useState('')
  const [from,     setFrom]     = useState('')
  const [to,       setTo]       = useState('')
  const [page,     setPage]     = useState(0)
  const limit = 50

  const buildUrl = useCallback(() => {
    const p = new URLSearchParams()
    if (platform !== 'all') p.set('platform', platform)
    if (action)   p.set('action', action)
    if (from)     p.set('from', from)
    if (to)       p.set('to', to)
    p.set('limit',  String(limit))
    p.set('offset', String(page * limit))
    return `/api/admin/audit-log?${p.toString()}`
  }, [platform, action, from, to, page])

  const { data, isLoading, mutate } = useSWR<{
    logs: AuditEntry[]
    total: number
    platforms: string[]
    actions: string[]
  }>(buildUrl(), fetcher, { keepPreviousData: true })

  const totalPages = Math.ceil((data?.total ?? 0) / limit)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={platform} onValueChange={v => { setPlatform(v); setPage(0) }}>
              <SelectTrigger><SelectValue placeholder="المنصة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المنصات</SelectItem>
                {(data?.platforms ?? ['maqraa','academy','site']).map(p => (
                  <SelectItem key={p} value={p}>{PLATFORM_LABELS[p] ?? p}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pr-9"
                placeholder="بحث في الحدث..."
                value={action}
                onChange={e => { setAction(e.target.value); setPage(0) }}
              />
            </div>

            <Input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(0) }} />
            <Input type="date" value={to}   onChange={e => { setTo(e.target.value);   setPage(0) }} />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3 px-5">
          <div>
            <CardTitle className="text-base">سجل الأحداث الحساسة</CardTitle>
            <CardDescription>{data?.total ?? 0} حدث إجمالاً</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="h-4 w-4 ml-1" /> تحديث
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">جاري التحميل...</div>
          ) : !data?.logs?.length ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">لا توجد أحداث</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr className="text-right">
                    <th className="px-4 py-2 font-medium">الحدث</th>
                    <th className="px-4 py-2 font-medium">المنصة</th>
                    <th className="px-4 py-2 font-medium">المنفِّذ</th>
                    <th className="px-4 py-2 font-medium">الكيان</th>
                    <th className="px-4 py-2 font-medium">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.logs.map(log => (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLATFORM_COLORS[log.platform] ?? ''}`}>
                          {PLATFORM_LABELS[log.platform] ?? log.platform}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{log.actor_name ?? '—'}</div>
                        <div className="text-xs text-muted-foreground">{log.actor_email_resolved ?? log.actor_email ?? ''}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {log.entity_type ? `${log.entity_type}${log.entity_id ? ` #${log.entity_id.slice(0,8)}` : ''}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.created_at), 'dd MMM yyyy – HH:mm', { locale: ar })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-sm text-muted-foreground">
                صفحة {page + 1} من {totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Activity Logs (Operations) ───────────────────────────────────────────────

interface ActivityEntry {
  id: string
  action: string
  entity_type: string | null
  description: string | null
  status: string | null
  ip_address: string | null
  created_at: string
  user_name: string | null
  user_email: string | null
  user_role: string | null
}

const STATUS_COLORS: Record<string, string> = {
  success: 'bg-green-100 text-green-800',
  error:   'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800',
}

function ActivityLogTab() {
  const [search, setSearch]   = useState('')
  const [action, setAction]   = useState('all')
  const [from,   setFrom]     = useState('')
  const [to,     setTo]       = useState('')
  const [page,   setPage]     = useState(1)
  const limit = 50

  const buildUrl = useCallback(() => {
    const p = new URLSearchParams()
    if (search)        p.set('search', search)
    if (action !== 'all') p.set('action', action)
    if (from)          p.set('dateFrom', from)
    if (to)            p.set('dateTo', to)
    p.set('page', String(page))
    return `/api/admin/activity-logs?${p.toString()}`
  }, [search, action, from, to, page])

  const { data, isLoading, mutate } = useSWR<{
    logs: ActivityEntry[]
    total: number
    actions: string[]
    page: number
    limit: number
  }>(buildUrl(), fetcher, { keepPreviousData: true })

  const totalPages = Math.ceil((data?.total ?? 0) / limit)

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={action} onValueChange={v => { setAction(v); setPage(1) }}>
              <SelectTrigger><SelectValue placeholder="نوع الفعل" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأفعال</SelectItem>
                {(data?.actions ?? []).map(a => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pr-9"
                placeholder="بحث..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
              />
            </div>

            <Input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1) }} />
            <Input type="date" value={to}   onChange={e => { setTo(e.target.value);   setPage(1) }} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3 px-5">
          <div>
            <CardTitle className="text-base">سجل نشاط العمليات</CardTitle>
            <CardDescription>{data?.total ?? 0} حدث إجمالاً</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="h-4 w-4 ml-1" /> تحديث
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">جاري التحميل...</div>
          ) : !data?.logs?.length ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">لا يوجد نشاط</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr className="text-right">
                    <th className="px-4 py-2 font-medium">الفعل</th>
                    <th className="px-4 py-2 font-medium">الحالة</th>
                    <th className="px-4 py-2 font-medium">المستخدم</th>
                    <th className="px-4 py-2 font-medium">الوصف</th>
                    <th className="px-4 py-2 font-medium">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.logs.map(log => (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                      <td className="px-4 py-3">
                        {log.status && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[log.status] ?? 'bg-gray-100 text-gray-800'}`}>
                            {log.status}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{log.user_name ?? '—'}</div>
                        <div className="text-xs text-muted-foreground">{log.user_email ?? ''}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs max-w-xs truncate">
                        {log.description ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.created_at), 'dd MMM yyyy – HH:mm', { locale: ar })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-sm text-muted-foreground">
                صفحة {page} من {totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Unified Component ─────────────────────────────────────────────────────────

export default function UnifiedAuditLog() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">سجل التدقيق الموحد</h1>
        <p className="text-muted-foreground mt-1">
          مراقبة شاملة لأحداث الحوكمة ونشاط العمليات عبر المنصتين
        </p>
      </div>

      <Tabs defaultValue="governance" dir="rtl">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="governance" className="gap-2">
            <Shield className="h-4 w-4" />
            الحوكمة
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            العمليات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="governance" className="mt-6">
          <AuditLogTab />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <ActivityLogTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
