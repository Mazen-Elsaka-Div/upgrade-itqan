import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'
import { CertificateRequest, Tone } from './types'
import { TONE_CLASSES } from './utils'

interface StatusCardProps {
  request: CertificateRequest
  kindLabel: (k: string, isAr: boolean) => string
  isAr: boolean
  requestBase: string
}

export function StatusCard({ request, kindLabel, isAr, requestBase }: StatusCardProps) {
  const statusLabel: Record<string, { ar: string; en: string; tone: Tone }> = {
    submitted: {
      ar: 'في انتظار اعتماد الإدارة أو المدرس',
      en: 'Pending admin or teacher approval',
      tone: 'blue',
    },
    approved: {
      ar: 'تم الاعتماد — قيد الإصدار',
      en: 'Approved — issuing',
      tone: 'blue',
    },
    rejected: {
      ar: 'مرفوض',
      en: 'Rejected',
      tone: 'rose',
    },
  }
  const s = statusLabel[request.status] || statusLabel.submitted
  const tone = TONE_CLASSES[s.tone]
  
  return (
    <Card className="rounded-3xl border border-border/50 bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-4">
          <span
            className={`w-12 h-12 rounded-2xl ${tone.bg} ${tone.text} flex items-center justify-center shrink-0 ring-1 ring-inset ring-black/5 dark:ring-white/5`}
          >
            <Clock className="w-5 h-5" />
          </span>
          <div className="flex-1 min-w-0 pt-1">
            <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${tone.text}`}>
              {kindLabel(request.kind, isAr)}
            </p>
            <h3 className="text-xl font-bold truncate text-balance">
              {request.source_label || (isAr ? 'شهادة' : 'Certificate')}
            </h3>
            <p className={`text-sm font-medium mt-1 ${tone.text}`}>
              {isAr ? s.ar : s.en}
            </p>
          </div>
        </div>
        {request.rejection_reason && (
          <div className="text-sm font-medium text-rose-700 bg-rose-50/50 rounded-2xl p-4 text-pretty leading-relaxed ring-1 ring-inset ring-rose-200/50">
            <span className="font-bold">{isAr ? 'سبب الرفض: ' : 'Reason: '}</span>
            {request.rejection_reason}
          </div>
        )}
        {request.status === 'rejected' && (
          <Link href={`${requestBase}/${request.id}`} className="block">
            <Button variant="outline" className="w-full h-11 rounded-xl active:scale-[0.96] transition-transform">
              {isAr ? 'إعادة الإرسال' : 'Resubmit'}
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
