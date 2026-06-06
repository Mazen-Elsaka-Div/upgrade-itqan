import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, FileText } from 'lucide-react'
import { CertificateRequest } from './types'

interface ActionCardProps {
  request: CertificateRequest
  kindLabel: (k: string, isAr: boolean) => string
  isAr: boolean
  requestBase: string
}

export function ActionCard({ request, kindLabel, isAr, requestBase }: ActionCardProps) {
  return (
    <Card className="border-amber-200/60 bg-amber-50/40 hover:shadow-md transition-[box-shadow] duration-200 rounded-xl">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">
              {kindLabel(request.kind, isAr)}
            </p>
            <h3 className="text-lg font-black truncate text-balance">
              {request.source_label || (isAr ? 'شهادة جاهزة للإصدار' : 'New certificate ready')}
            </h3>
            {request.reason && (
              <p className="text-sm text-amber-800 mt-1 text-pretty">{request.reason}</p>
            )}
          </div>
        </div>
        <Link href={`${requestBase}/${request.id}`}>
          <Button className="w-full active:scale-[0.96] rounded-lg transition-transform" variant="default">
            <FileText className="w-4 h-4 me-2" />
            {isAr ? 'إكمال بيانات الشهادة' : 'Complete certificate details'}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
