'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Video } from 'lucide-react'

interface Props {
  sessionId: string
  initialShared: boolean
  hasRecording: boolean
}

export function RecordingShareToggle({ sessionId, initialShared, hasRecording }: Props) {
  const [isShared, setIsShared] = useState(initialShared)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  if (!hasRecording) return null

  const handleToggle = async (checked: boolean) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/academy/teacher/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_recording_shared: checked })
      })

      if (!res.ok) throw new Error('Failed to update')
      
      setIsShared(checked)
      toast({
        title: 'تم التحديث بنجاح',
        description: checked ? 'تمت مشاركة التسجيل مع الطلاب' : 'تم إخفاء التسجيل عن الطلاب',
      })
      router.refresh()
    } catch (error) {
      toast({
        title: 'حدث خطأ',
        description: 'لم نتمكن من تحديث حالة التسجيل',
        variant: 'destructive',
      })
      setIsShared(!checked)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/20">
      <div className="space-y-1">
        <Label className="flex items-center gap-2 text-base font-semibold">
          <Video className="w-5 h-5 text-blue-500" />
          مشاركة التسجيل مع الطلاب
        </Label>
        <p className="text-sm text-muted-foreground leading-relaxed">
          عند التفعيل، سيتمكن جميع الطلاب في الدورة من مشاهدة التسجيل سواء حضروا أم لا.
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        <Switch 
          checked={isShared} 
          onCheckedChange={handleToggle} 
          disabled={loading}
          className="data-[state=checked]:bg-blue-600"
        />
      </div>
    </div>
  )
}
