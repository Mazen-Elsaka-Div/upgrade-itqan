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
    <Card className="group border-border/50 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-primary/20 transition-[box-shadow,transform,border-color] duration-200 bg-card overflow-hidden rounded-xl relative">
      <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none transition-opacity duration-200 group-hover:opacity-10">
        <Award className="w-32 h-32 text-primary -rotate-12 translate-x-8 -translate-y-8" />
      </div>
      <CardContent className="p-0">
        <div className="p-6 pb-0 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4 text-primary" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-muted-foreground uppercase">
                {kindLabel(cert.kind, isAr)}
              </p>
              <h3 className="text-lg font-bold truncate text-balance">
                {cert.source_label || (isAr ? 'شهادة معتمدة' : 'Certificate')}
              </h3>
            </div>
          </div>
          <div className="space-y-2 pt-4 border-t border-border/50">
            {cert.teacher_name && (
              <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                <User className="w-4 h-4 text-primary/70 shrink-0" />
                <span>
                  {isAr ? 'الأستاذ: ' : 'Teacher: '}
                  {cert.teacher_name}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
              <Calendar className="w-4 h-4 text-primary/70 shrink-0" />
              <span dir="ltr" className="tabular-nums">
                {new Date(date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
              </span>
            </div>
            {cert.certificate_number && (
              <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground/80">
                <span className="tabular-nums">{cert.certificate_number}</span>
              </div>
            )}
          </div>
        </div>
        <div className="px-6 pb-6 pt-4">
          {cert.pdf_url ? (
            <a href={cert.pdf_url} target="_blank" rel="noopener noreferrer" className="block outline-none">
              <Button variant="default" className="w-full active:scale-[0.96] rounded-lg transition-transform">
                <Download className="w-4 h-4 me-2" />
                {isAr ? 'تحميل الشهادة' : 'Download'}
              </Button>
            </a>
          ) : (
            <Button variant="outline" className="w-full rounded-lg" disabled>
              <Inbox className="w-4 h-4 me-2" />
              {isAr ? 'لا يوجد ملف بعد' : 'No file yet'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
