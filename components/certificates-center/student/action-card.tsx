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
    <Card className="group relative overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-amber-50 to-orange-50/50 shadow-sm hover:shadow-lg transition-all duration-300 ring-1 ring-amber-500/10">
      <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] pointer-events-none" />
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-colors duration-500 pointer-events-none" />
      
      <CardContent className="p-6 relative z-10 space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform duration-300">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <p className="text-xs font-bold text-amber-700/80 uppercase tracking-wider mb-1">
              {kindLabel(request.kind, isAr)}
            </p>
            <h3 className="text-xl font-black text-amber-950 truncate text-balance">
              {request.source_label || (isAr ? 'شهادة جاهزة للإصدار' : 'New certificate ready')}
            </h3>
            {request.reason && (
              <p className="text-sm font-medium text-amber-800/80 mt-1.5 text-pretty leading-snug">{request.reason}</p>
            )}
          </div>
        </div>
        <Link href={`${requestBase}/${request.id}`} className="block">
          <Button 
            className="w-full h-12 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm hover:shadow active:scale-[0.96] transition-all duration-200"
          >
            <FileText className="w-4 h-4 me-2" />
            <span className="font-bold">{isAr ? 'إكمال بيانات الشهادة' : 'Complete certificate details'}</span>
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
