'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent } from '@/components/ui/card'
import { Award, Sparkles, Hourglass, CheckCircle2, XCircle } from 'lucide-react'

import { CertificateRequest, CertificatesPayload, Tone } from './student/types'
import { TONE_CLASSES, kindLabel } from './student/utils'
import { ActionCard } from './student/action-card'
import { StatusCard } from './student/status-card'
import { IssuedCard } from './student/issued-card'
import { CertificatesSkeleton } from './student/certificates-skeleton'
import { ErrorState } from './student/error-state'

const RequestBaseCtx = createContext<string>('/academy/student/certificates/request')
export function useRequestBase() {
  return useContext(RequestBaseCtx)
}

interface StudentCertificatesCenterProps {
  apiBase?: string
  requestBase?: string
  title_ar?: string
  title_en?: string
  subtitle_ar?: string
  subtitle_en?: string
}

export default function StudentCertificatesCenter({
  apiBase = '/api/academy/student/certificates',
  requestBase = '/academy/student/certificates/request',
  title_ar = 'شهاداتي',
  title_en = 'My Certificates',
  subtitle_ar = 'كل شهاداتك في مكان واحد — الصادرة، قيد المراجعة، والتي تنتظر إكمال بياناتها.',
  subtitle_en = 'All your certificates in one place — issued, pending review, and awaiting your data.',
}: StudentCertificatesCenterProps = {}) {
  const { locale } = useI18n()
  
  return (
    <RequestBaseCtx.Provider value={requestBase}>
      <CenterInner
        apiBase={apiBase}
        title_ar={title_ar}
        title_en={title_en}
        subtitle_ar={subtitle_ar}
        subtitle_en={subtitle_en}
      />
    </RequestBaseCtx.Provider>
  )
}

interface InnerProps {
  apiBase: string
  title_ar: string
  title_en: string
  subtitle_ar: string
  subtitle_en: string
}

function CenterInner({
  apiBase,
  title_ar,
  title_en,
  subtitle_ar,
  subtitle_en,
}: InnerProps) {
  const { locale } = useI18n()
  const isAr = locale === 'ar'
  const requestBase = useRequestBase()
  
  const [data, setData] = useState<CertificatesPayload>({
    data_required: [],
    submitted: [],
    approved: [],
    rejected: [],
    issued: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(false)
    fetch(apiBase)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load')
        return r.json()
      })
      .then((d) => {
        setData({
          data_required: d.data_required || [],
          submitted: d.submitted || [],
          approved: d.approved || [],
          rejected: d.rejected || [],
          issued: d.issued || [],
        })
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [apiBase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return <CertificatesSkeleton />
  }

  if (error) {
    return (
      <ErrorState 
        message={isAr ? 'لم نتمكن من جلب بيانات الشهادات الخاصة بك.' : 'Failed to load your certificates.'} 
        retry={fetchData} 
        isAr={isAr} 
      />
    )
  }

  return (
    <div
      className="max-w-6xl mx-auto space-y-8 pb-12"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div id="data-required" className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <Award className="w-4 h-4" />
            {isAr ? title_ar : title_en}
          </div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-foreground text-balance">
            {isAr ? title_ar : title_en}
          </h1>
          <p className="text-muted-foreground font-medium max-w-2xl text-pretty">
            {isAr ? subtitle_ar : subtitle_en}
          </p>
        </div>
      </div>

      {/* ─── Action required ───────────────────────────────────────── */}
      {data.data_required.length > 0 && (
        <Section
          title={isAr ? 'تحتاج إكمال بيانات' : 'Action required'}
          tone="amber"
          icon={Sparkles}
          count={data.data_required.length}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.data_required.map((r) => (
              <ActionCard
                key={r.id}
                request={r}
                kindLabel={kindLabel}
                isAr={isAr}
                requestBase={requestBase}
              />
            ))}
          </div>
        </Section>
      )}

      {/* ─── In review ─────────────────────────────────────────────── */}
      {data.submitted.length + data.approved.length > 0 && (
        <Section
          title={isAr ? 'قيد المراجعة' : 'In review'}
          tone="blue"
          icon={Hourglass}
          count={data.submitted.length + data.approved.length}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...data.submitted, ...data.approved].map((r) => (
              <StatusCard
                key={r.id}
                request={r}
                kindLabel={kindLabel}
                isAr={isAr}
                requestBase={requestBase}
              />
            ))}
          </div>
        </Section>
      )}

      {/* ─── Issued ────────────────────────────────────────────────── */}
      <Section
        title={isAr ? 'الشهادات الصادرة' : 'Issued certificates'}
        tone="emerald"
        icon={CheckCircle2}
        count={data.issued.length}
      >
        {data.issued.length === 0 ? (
          <Card className="border border-border/50 shadow-sm bg-card overflow-hidden rounded-xl">
            <CardContent className="p-16 text-center space-y-6">
              <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-12 h-12 text-primary/40" />
              </div>
              <h3 className="text-2xl font-black text-foreground text-balance">
                {isAr ? 'لا توجد شهادات حتى الآن' : 'No certificates yet'}
              </h3>
              <p className="text-muted-foreground font-medium leading-relaxed max-w-sm mx-auto text-pretty">
                {isAr
                  ? 'أكمل الدورات والمسارات والمسابقات لتحصل على شهادات معتمدة.'
                  : 'Finish courses, paths, and competitions to earn approved certificates.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.issued.map((cert) => (
              <IssuedCard
                key={cert.id}
                cert={cert}
                kindLabel={kindLabel}
                isAr={isAr}
              />
            ))}
          </div>
        )}
      </Section>

      {/* ─── Rejected ─────────────────────────────────────────────── */}
      {data.rejected.length > 0 && (
        <Section
          title={isAr ? 'طلبات مرفوضة' : 'Rejected requests'}
          tone="rose"
          icon={XCircle}
          count={data.rejected.length}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.rejected.map((r) => (
              <StatusCard
                key={r.id}
                request={r}
                kindLabel={kindLabel}
                isAr={isAr}
                requestBase={requestBase}
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

function Section({
  title,
  tone,
  icon: Icon,
  count,
  children,
}: {
  title: string
  tone: Tone
  icon: React.ElementType
  count: number
  children: React.ReactNode
}) {
  const cls = TONE_CLASSES[tone]
  return (
    <section className="space-y-4">
      <header className="flex items-center gap-3">
        <span
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${cls.bg} ${cls.text}`}
        >
          <Icon className="w-4 h-4" />
        </span>
        <h2 className="text-xl font-black tracking-tight text-balance">{title}</h2>
        <span className="text-sm font-bold text-muted-foreground tabular-nums">
          ({count})
        </span>
      </header>
      {children}
    </section>
  )
}
