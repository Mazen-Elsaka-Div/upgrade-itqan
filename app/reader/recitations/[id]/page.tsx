"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { PageLoadingSkeleton } from '@/components/ui/page-loading-skeleton'
import { 
  Play, Pause, RotateCcw, CheckCircle, XCircle, 
  ChevronLeft, ChevronRight, MessageSquare, Award,
  Clock, AlertCircle, Loader2, Info, ArrowLeft, Mic, Calendar, X
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AudioPlayer } from "@/components/audio-player"

interface Recitation {
  id: string
  student_id: string
  student_name: string
  surah_name: string
  ayah_from: number
  ayah_to: number
  audio_url: string
  status: string
  created_at: string
}

export default function RecitationReviewPage() {
  const { id } = useParams()
  const router = useRouter()
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  
  const [recitation, setRecitation] = useState<Recitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [verdict, setVerdict] = useState<'mastered' | 'needs_session' | null>(null)
  const [feedback, setFeedback] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [mistakeWords, setMistakeWords] = useState<string[]>([])
  const [newMistake, setNewMistake] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/recitations/${id}`)
        if (res.ok) {
          const data = await res.json()
          setRecitation(data.recitation)
        } else {
          toast.error("Recitation not found")
          router.push("/reader/recitations")
        }
      } catch (err) {
        toast.error("Error loading recitation")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, router])


  const handleSubmit = async () => {
    if (!verdict) {
      toast.error(isAr ? "يرجى اختيار النتيجة أولاً" : "Please select a verdict first")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/recitations/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verdict,
          feedback,
          mistakeWords
        })
      })

      if (res.ok) {
        toast.success(t.reader.reviewSubmitted)
        router.push("/reader/recitations")
      } else {
        const errData = await res.json().catch(() => null)
        toast.error(errData?.error || (isAr ? "فشل في إرسال التقييم" : "Failed to submit review"))
      }
    } catch (err) {
      toast.error(isAr ? "حدث خطأ عند الإرسال" : "Error submitting review")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <PageLoadingSkeleton />
  }

  if (!recitation) return null

  return (
    <div className="bg-card min-h-full -m-6 lg:-m-8 p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header with Back Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.back()}
            className="w-14 h-14 rounded-2xl bg-card/60 backdrop-blur-xl border border-border flex items-center justify-center hover:bg-muted transition-all active:scale-95 shadow-lg shadow-black/5"
          >
            <ArrowLeft className="w-6 h-6 rtl:rotate-180 text-foreground" />
          </button>
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-foreground tracking-tight">{isAr ? "تقييم التلاوة" : "Recitation Review"}</h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <span className="text-primary font-black uppercase tracking-widest text-[10px] bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                {recitation.surah_name}
              </span>
              • {t.reader.student}: <span className="text-foreground font-bold">{recitation.student_name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap justify-end gap-3">
          <button
            onClick={() => router.push(`/reader/chat?userId=${recitation.student_id}&userRole=student`)}
            className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-4 py-3 rounded-2xl transition-all font-black text-sm shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">{isAr ? "مراسلة الطالب" : "Message Student"}</span>
          </button>
          
          <div className="flex items-center gap-3 bg-card/40 backdrop-blur-md border border-border p-4 rounded-2xl shadow-sm">
            <Clock className="w-5 h-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{isAr ? "تاريخ التقديم" : "Submitted On"}</span>
              <span className="text-sm font-black text-foreground">
                {new Date(recitation.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Player and Assessment */}
        <div className="xl:col-span-2 space-y-8">
          {/* Audio Player Card - Glassmorphism */}
          <div className="p-1 rounded-[40px] border border-border bg-muted/20 shadow-2xl shadow-black/5 relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50" />
            
            <div className="bg-card/80 backdrop-blur-2xl p-8 rounded-[38px] relative z-10 space-y-8">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-[22px] flex items-center justify-center text-primary shadow-inner">
                  <Mic className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-foreground tracking-tight">{isAr ? "الاستماع للتلاوة" : "Audio Recording"}</h3>
                  <p className="text-muted-foreground text-sm font-medium">{isAr ? "من الآية" : "From Ayah"} {recitation.ayah_from} {isAr ? "إلى" : "to"} {recitation.ayah_to}</p>
                </div>
              </div>

              <AudioPlayer src={recitation.audio_url} />
            </div>
          </div>

          {/* Assessment Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-xl border border-accent/20">
                <Award className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-xl font-black text-foreground tracking-tight uppercase tracking-widest text-sm">{isAr ? "تقييم المستوى" : "Skill Assessment"}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => setVerdict('mastered')}
                className={cn(
                  "p-8 rounded-[32px] border-2 transition-all duration-500 flex flex-col items-center gap-4 text-center group",
                  verdict === 'mastered' 
                    ? "bg-primary/10 border-primary ring-4 ring-primary/5" 
                    : "bg-card/40 border-border hover:border-primary/30 hover:bg-muted/30"
                )}
              >
                <div className={cn(
                  "w-20 h-20 rounded-[24px] flex items-center justify-center transition-all duration-500",
                  verdict === 'mastered' ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-110" : "bg-muted text-muted-foreground group-hover:scale-105"
                )}>
                  <CheckCircle className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-black text-foreground">{isAr ? "متقن" : "Mastered"}</h4>
                  <p className="text-muted-foreground text-xs font-semibold leading-relaxed">
                    {isAr ? "التلاوة صحيحة وبإمكان الطالب الانتقال للمرحلة التالية." : "Recitation is correct and student can proceed to the next stage."}
                  </p>
                </div>
              </button>

              <button
                onClick={() => setVerdict('needs_session')}
                className={cn(
                  "p-8 rounded-[32px] border-2 transition-all duration-500 flex flex-col items-center gap-4 text-center group",
                  verdict === 'needs_session' 
                    ? "bg-amber-500/10 border-amber-500 ring-4 ring-amber-500/5" 
                    : "bg-card/40 border-border hover:border-amber-500/30 hover:bg-muted/30"
                )}
              >
                <div className={cn(
                  "w-20 h-20 rounded-[24px] flex items-center justify-center transition-all duration-500",
                  verdict === 'needs_session' ? "bg-amber-500 text-white shadow-xl shadow-amber-500/20 scale-110" : "bg-muted text-muted-foreground group-hover:scale-105"
                )}>
                  <Calendar className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-black text-foreground">{isAr ? "يحتاج جلسة مصححة" : "Needs Session"}</h4>
                  <p className="text-muted-foreground text-xs font-semibold leading-relaxed">
                    {isAr ? "هناك ملاحظات تتطلب جلسة تصحيحية مباشرة مع المعلم." : "Notes require a live correction session with the teacher."}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Feedback and Submit */}
        <div className="space-y-8">
          <div className="p-1 rounded-[40px] border border-border bg-muted/20 shadow-2xl shadow-black/5 relative overflow-hidden h-full">
            <div className="bg-card/80 backdrop-blur-2xl p-8 rounded-[38px] space-y-8 h-full flex flex-col">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-[20px] flex items-center justify-center text-blue-500 shadow-inner">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-foreground tracking-tight">{isAr ? "الملاحظات" : "Feedback"}</h3>
                  <p className="text-muted-foreground text-sm font-medium">{isAr ? "كيف كان أداء الطالب؟" : "How was the student's performance?"}</p>
                </div>
              </div>

              <div className="relative flex-grow min-h-[150px]">
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={isAr ? "اكتب ملاحظاتك للطالب هنا... (اختياري)" : "Write your feedback for the student here... (optional)"}
                  className="w-full h-full p-6 rounded-[28px] bg-card border border-border focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none font-medium text-foreground leading-relaxed shadow-inner"
                />
              </div>

              {/* Mistake Words Restoration */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-destructive" />
                  {isAr ? "الكلمات الخاطئة" : "Mistake Words"}
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMistake}
                    onChange={(e) => setNewMistake(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newMistake.trim()) {
                        setMistakeWords([...mistakeWords, newMistake.trim()])
                        setNewMistake("")
                      }
                    }}
                    placeholder={isAr ? "أضف كلمة وأطغط Enter..." : "Add word & press Enter..."}
                    className="flex-grow h-12 px-4 rounded-xl bg-muted/50 border border-border focus:bg-card focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-sm"
                  />
                  <button
                    onClick={() => {
                      if (newMistake.trim()) {
                        setMistakeWords([...mistakeWords, newMistake.trim()])
                        setNewMistake("")
                      }
                    }}
                    className="h-12 px-4 bg-primary text-primary-foreground rounded-xl font-black text-sm hover:scale-105 active:scale-95 transition-all"
                  >
                    {isAr ? "إضافة" : "Add"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {mistakeWords.map((word, i) => (
                    <span key={i} className="flex items-center gap-2 bg-destructive/10 text-destructive border border-destructive/20 px-3 py-1.5 rounded-xl text-xs font-black animate-in zoom-in-50 duration-300">
                      {word}
                      <button onClick={() => setMistakeWords(mistakeWords.filter((_, idx) => idx !== i))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <Info className="w-5 h-5 text-primary shrink-0" />
                  <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase tracking-wider">
                    {isAr ? "سيصل الطالب إشعار فور اعتماد النتيجة والملاحظات." : "The student will be notified once the result is approved."}
                  </p>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting || !verdict}
                  className={cn(
                    "w-full h-20 rounded-[28px] font-black text-lg flex items-center justify-center gap-4 transition-all active:scale-[0.98] shadow-2xl relative overflow-hidden group",
                    verdict ? "bg-primary text-primary-foreground shadow-primary/30" : "bg-muted text-muted-foreground cursor-not-allowed opacity-70"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  {submitting ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-6 h-6" />
                      <span>{isAr ? "اعتماد وإرسال التقييم" : "Approve & Send Feedback"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
