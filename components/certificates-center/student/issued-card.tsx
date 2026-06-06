import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Award, User, Calendar, Download, Inbox } from 'lucide-react'
import { CertificateRequest } from './types'

interface IssuedCardProps {
  cert: CertificateRequest
  kindLabel: (k: string, isAr: boolean) => string
  isAr: boolean
}

export function IssuedCard({ cert, kindLabel, isAr }: IssuedCardProps) {
  const date = cert.issued_at || cert.approved_at || cert.requested_at
  
  return (
    <Card className="group relative overflow-hidden rounded-3xl border border-border/40 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-card">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transition-transform duration-500 group-hover:opacity-10 group-hover:scale-110 group-hover:-rotate-6">
        <Award className="w-40 h-40 text-primary" />
      </div>
      <CardContent className="p-0 flex flex-col h-full">
        <div className="p-6 pb-5 space-y-5 flex-1 relative z-10">
          <div className="flex items-start gap-4">
            <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 ring-1 ring-inset ring-primary/20 shadow-inner">
              <Award className="w-6 h-6 text-primary" />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                {kindLabel(cert.kind, isAr)}
              </p>
              <h3 className="text-xl font-bold truncate text-balance">
                {cert.source_label || (isAr ? 'شهادة معتمدة' : 'Certificate')}
              </h3>
            </div>
          </div>
          <div className="space-y-3 pt-5 border-t border-dashed border-border/60">
            {cert.teacher_name && (
              <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                </span>
                <span className="truncate">
                  {isAr ? 'الأستاذ: ' : 'Teacher: '}
                  <span className="text-foreground">{cert.teacher_name}</span>
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              </span>
              <span dir="ltr" className="tabular-nums">
                {new Date(date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
              </span>
            </div>
            {cert.certificate_number && (
              <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground/80 mt-1 pl-9">
                <span className="tabular-nums">#{cert.certificate_number}</span>
              </div>
            )}
          </div>
        </div>
        <div className="p-4 pt-0 mt-auto relative z-10">
          {cert.pdf_url ? (
            <a href={cert.pdf_url} target="_blank" rel="noopener noreferrer" className="block outline-none">
              <Button variant="default" className="w-full h-12 rounded-xl active:scale-[0.96] transition-all duration-200 shadow-sm hover:shadow">
                <Download className="w-4 h-4 me-2" />
                <span className="font-bold">{isAr ? 'تحميل الشهادة' : 'Download'}</span>
              </Button>
            </a>
          ) : (
            <Button variant="secondary" className="w-full h-12 rounded-xl opacity-70" disabled>
              <Inbox className="w-4 h-4 me-2" />
              <span className="font-bold">{isAr ? 'لا يوجد ملف بعد' : 'No file yet'}</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
