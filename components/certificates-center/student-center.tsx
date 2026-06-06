'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Award, Sparkles, Hourglass, CheckCircle2, XCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { CertificateRequest, CertificatesPayload, Tone } from './student/types'
import { kindLabel } from './student/utils'
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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  }

  const inReviewCount = data.submitted.length + data.approved.length

  return (
    <div
      className="max-w-6xl mx-auto space-y-12 pb-12"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* ─── Hero Section ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-background border border-border/50 p-8 md:p-12 shadow-sm">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary/10 text-primary text-sm font-bold uppercase tracking-wider w-fit shadow-sm ring-1 ring-primary/20 backdrop-blur-md">
              <Award className="w-5 h-5" />
              {isAr ? title_ar : title_en}
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground text-balance">
              {isAr ? title_ar : title_en}
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl font-medium text-pretty leading-relaxed">
              {isAr ? subtitle_ar : subtitle_en}
            </p>
          </div>
          
          <div className="flex items-center gap-6 p-6 rounded-3xl bg-background/50 backdrop-blur-md border border-border/50 shadow-sm shrink-0">
            <div className="text-center">
              <div className="text-4xl font-black text-primary tabular-nums">{data.issued.length}</div>
              <div className="text-sm font-bold text-muted-foreground mt-1">{isAr ? 'شهادة معتمدة' : 'Issued'}</div>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <div className="text-4xl font-black text-blue-500 tabular-nums">{inReviewCount}</div>
              <div className="text-sm font-bold text-muted-foreground mt-1">{isAr ? 'قيد المراجعة' : 'In Review'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Action Required (High Priority Alerts) ───────────────────── */}
      {data.data_required.length > 0 && (
        <motion.div 
          initial="hidden" 
          animate="show" 
          variants={containerVariants}
          className="space-y-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </div>
            <h2 className="text-xl font-black text-amber-600">{isAr ? 'إجراءات مطلوبة عاجلاً' : 'Action Required Now'}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.data_required.map((r) => (
              <motion.div key={r.id} variants={itemVariants}>
                <ActionCard
                  request={r}
                  kindLabel={kindLabel}
                  isAr={isAr}
                  requestBase={requestBase}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── Main Content Tabs ───────────────────────────────────────── */}
      <Tabs defaultValue="issued" className="w-full" dir={isAr ? 'rtl' : 'ltr'}>
        <TabsList className="w-full justify-start h-auto p-1.5 bg-muted/50 rounded-2xl overflow-x-auto flex-nowrap scrollbar-hide mb-8 border border-border/50">
          <TabsTrigger value="issued" className="rounded-xl px-6 py-3 text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 transition-all">
            <CheckCircle2 className="w-4 h-4 me-2" />
            {isAr ? 'الشهادات الصادرة' : 'Issued'}
            <span className="ms-2 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs tabular-nums">{data.issued.length}</span>
          </TabsTrigger>
          <TabsTrigger value="review" className="rounded-xl px-6 py-3 text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-blue-600 transition-all">
            <Hourglass className="w-4 h-4 me-2" />
            {isAr ? 'قيد المراجعة' : 'In Review'}
            <span className="ms-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs tabular-nums">{inReviewCount}</span>
          </TabsTrigger>
          {data.rejected.length > 0 && (
            <TabsTrigger value="rejected" className="rounded-xl px-6 py-3 text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-rose-600 transition-all">
              <XCircle className="w-4 h-4 me-2" />
              {isAr ? 'طلبات مرفوضة' : 'Rejected'}
              <span className="ms-2 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs tabular-nums">{data.rejected.length}</span>
            </TabsTrigger>
          )}
        </TabsList>

        <AnimatePresence mode="wait">
          {/* ─── Issued Tab ─── */}
          <TabsContent value="issued" className="mt-0 outline-none">
            {data.issued.length === 0 ? (
              <EmptyState 
                icon={Award}
                title={isAr ? 'لا توجد شهادات حتى الآن' : 'No certificates yet'}
                description={isAr ? 'أكمل الدورات والمسارات بنجاح لتحصل على شهاداتك المعتمدة وتزين بها ملفك الشخصي.' : 'Finish courses and paths to earn your approved certificates and decorate your profile.'}
              />
            ) : (
              <motion.div 
                initial="hidden" animate="show" exit="hidden" variants={containerVariants}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {data.issued.map((cert) => (
                  <motion.div key={cert.id} variants={itemVariants}>
                    <IssuedCard cert={cert} kindLabel={kindLabel} isAr={isAr} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </TabsContent>

          {/* ─── Review Tab ─── */}
          <TabsContent value="review" className="mt-0 outline-none">
            {inReviewCount === 0 ? (
              <EmptyState 
                icon={Hourglass}
                title={isAr ? 'لا توجد طلبات قيد المراجعة' : 'No requests in review'}
                description={isAr ? 'جميع طلباتك تم معالجتها ولا يوجد أي طلب معلق حالياً.' : 'All your requests have been processed and none are currently pending.'}
              />
            ) : (
              <motion.div 
                initial="hidden" animate="show" exit="hidden" variants={containerVariants}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {[...data.submitted, ...data.approved].map((r) => (
                  <motion.div key={r.id} variants={itemVariants}>
                    <StatusCard request={r} kindLabel={kindLabel} isAr={isAr} requestBase={requestBase} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </TabsContent>

          {/* ─── Rejected Tab ─── */}
          {data.rejected.length > 0 && (
            <TabsContent value="rejected" className="mt-0 outline-none">
              <motion.div 
                initial="hidden" animate="show" exit="hidden" variants={containerVariants}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {data.rejected.map((r) => (
                  <motion.div key={r.id} variants={itemVariants}>
                    <StatusCard request={r} kindLabel={kindLabel} isAr={isAr} requestBase={requestBase} />
                  </motion.div>
                ))}
              </motion.div>
            </TabsContent>
          )}
        </AnimatePresence>
      </Tabs>
    </div>
  )
}

function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, type: "spring" as const }}
    >
      <Card className="rounded-3xl border border-dashed border-border/60 shadow-sm bg-gradient-to-b from-muted/30 to-background overflow-hidden relative group">
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
        <CardContent className="p-16 text-center space-y-6 relative z-10">
          <div className="w-24 h-24 bg-background shadow-xl shadow-black/5 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 group-hover:rotate-6 transition-transform duration-500 ring-1 ring-border/50">
            <Icon className="w-12 h-12 text-muted-foreground/50" />
          </div>
          <h3 className="text-2xl font-black text-foreground tracking-tight text-balance">
            {title}
          </h3>
          <p className="text-muted-foreground font-medium leading-relaxed max-w-md mx-auto text-pretty">
            {description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
