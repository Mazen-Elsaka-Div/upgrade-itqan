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
      ar: 'في انتظار اعتماد الإدارة',
      en: 'Pending admin approval',
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
    <Card className="rounded-xl hover:shadow-md transition-[box-shadow] duration-200">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <span
            className={`w-10 h-10 rounded-lg ${tone.bg} ${tone.text} flex items-center justify-center shrink-0`}
          >
            <Clock className="w-5 h-5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold uppercase tracking-wide ${tone.text}`}>
              {kindLabel(request.kind, isAr)}
            </p>
            <h3 className="text-lg font-black truncate text-balance">
              {request.source_label || (isAr ? 'شهادة' : 'Certificate')}
            </h3>
            <p className={`text-sm mt-1 ${tone.text}`}>
              {isAr ? s.ar : s.en}
            </p>
          </div>
        </div>
        {request.rejection_reason && (
          <p className="text-xs text-rose-600 bg-rose-50 rounded-lg p-3 text-pretty">
            {isAr ? 'سبب الرفض: ' : 'Reason: '}
            {request.rejection_reason}
          </p>
        )}
        {request.status === 'rejected' && (
          <Link href={`${requestBase}/${request.id}`}>
            <Button variant="outline" size="sm" className="w-full active:scale-[0.96] rounded-lg transition-transform">
              {isAr ? 'إعادة الإرسال' : 'Resubmit'}
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
