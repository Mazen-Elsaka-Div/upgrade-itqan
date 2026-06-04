'use client'

import { useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PlayCircle, Loader2, AlertTriangle, Download } from 'lucide-react'

interface Props {
  url: string
  title: string
  children?: React.ReactNode
}

export function VideoPlayerModal({ url, title, children }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const durationFixedRef = useRef(false)

  const signedUrl = `/api/video/recordings/watch?url=${encodeURIComponent(url)}`

  // WebM files produced by MediaRecorder ship without a duration in their
  // metadata, so the browser reports `Infinity` and the controls show no
  // total time / disable seeking. Forcing a seek to a huge timestamp makes
  // the browser scan to the end and resolve the real duration; we then snap
  // back to the start.
  const handleLoadedMetadata = () => {
    setLoading(false)
    const v = videoRef.current
    if (!v) return
    if (v.duration === Infinity || Number.isNaN(v.duration)) {
      durationFixedRef.current = true
      const onDurationChange = () => {
        if (Number.isFinite(v.duration) && v.duration > 0) {
          v.removeEventListener('durationchange', onDurationChange)
          // Snap back so playback starts at the beginning.
          try {
            v.currentTime = 0
          } catch {
            /* ignore */
          }
        }
      }
      v.addEventListener('durationchange', onDurationChange)
      try {
        v.currentTime = 1e7
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (v) {
          setLoading(true)
          setError(null)
        }
      }}
    >
      <DialogTrigger asChild>
        {children ? (
          children
        ) : (
          <Button size="sm" className="flex-1 gap-1">
            <PlayCircle className="w-4 h-4" />
            مشاهدة
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl bg-black" dir="rtl">
        <DialogHeader className="p-4 absolute top-0 w-full z-10 bg-gradient-to-b from-black/80 to-transparent">
          <DialogTitle className="text-white">{title}</DialogTitle>
        </DialogHeader>
        {open && (
          <div className="relative w-full aspect-video flex items-center justify-center bg-black mt-12 mb-4">
            {loading && !error && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 text-white/70">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm">جارٍ تحميل التسجيل...</span>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-white/80 px-6 text-center">
                <AlertTriangle className="w-8 h-8 text-amber-400" />
                <span className="text-sm">{error}</span>
                <a
                  href={signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  فتح/تنزيل الملف
                </a>
              </div>
            )}
            <video
              ref={videoRef}
              src={signedUrl}
              controls
              playsInline
              preload="metadata"
              controlsList="nodownload"
              onLoadedMetadata={handleLoadedMetadata}
              onCanPlay={() => setLoading(false)}
              onPlaying={() => setLoading(false)}
              onError={(e) => {
                const mediaError = e.currentTarget.error
                console.log('[v0] recording playback error', {
                  code: mediaError?.code,
                  message: mediaError?.message,
                  src: signedUrl,
                })
                setLoading(false)
                let msg = 'تعذّر تشغيل هذا التسجيل.'
                if (mediaError?.code === 3) {
                  msg = 'تعذّر فك تشفير الفيديو. قد يكون التسجيل غير مكتمل أو تالف.'
                } else if (mediaError?.code === 4) {
                  msg = 'صيغة الفيديو غير مدعومة في هذا المتصفح، أو تعذّر الوصول إلى الملف.'
                } else if (mediaError?.code === 2) {
                  msg = 'حدث خطأ في الشبكة أثناء تحميل التسجيل.'
                }
                setError(msg)
              }}
              className="w-full h-full max-h-[75vh] outline-none"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
