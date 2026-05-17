"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    Clock, CheckCircle2, XCircle, Send, Loader2, RefreshCcw, AlertCircle,
    LogOut, Edit3, ArrowRight, BookOpen, Ban
} from "lucide-react"
import AudioRecorder from "@/components/applicant/audio-recorder"
import PdfUploader from "@/components/applicant/pdf-uploader"

type Question = {
    id: string
    label: string
    description: string | null
    type: "text" | "textarea" | "select" | "audio" | "file"
    options: string[] | null
    is_required: boolean
    sort_order: number
}

type ApplicationData = {
    user: { role: string; approval_status: string }
    application: {
        status: string
        responses: Record<string, any> | null
        audio_url: string | null
        cv_file_url?: string | null
        pdf_url?: string | null
        rejection_reason: string | null
        rejection_count: number
        submitted_at: string | null
        created_at?: string
    } | null
    questions: Question[]
}

export default function PendingApplicationPage() {
    const router = useRouter()
    const [data, setData] = useState<ApplicationData | null>(null)
    const [loading, setLoading] = useState(true)
    const [responses, setResponses] = useState<Record<string, any>>({})
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [reapplying, setReapplying] = useState(false)
    const [reapplyBlocked, setReapplyBlocked] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const load = async () => {
        setError(null)
        try {
            const res = await fetch("/api/auth/application/me")
            if (!res.ok) {
                if (res.status === 401) {
                    window.location.replace("/login")
                    return
                }
                throw new Error("فشل تحميل بيانات الطلب")
            }
            const json = (await res.json()) as ApplicationData
            setData(json)
            setResponses(json.application?.responses || {})
            setAudioUrl(json.application?.audio_url || null)
            setPdfUrl(
                json.application?.cv_file_url ||
                json.application?.pdf_url ||
                null
            )
            // If approved, redirect to the right dashboard
            if (json.user.approval_status === "approved") {
                if (json.user.role === "teacher") window.location.replace("/academy/teacher")
                else if (json.user.role === "reader") window.location.replace("/reader")
                else window.location.replace("/")
            }
        } catch (err: any) {
            setError(err?.message || "خطأ غير متوقع")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const saveDraft = async (extra?: Partial<{ audio_url: string | null; pdf_url: string | null }>) => {
        setSaving(true)
        setError(null)
        try {
            await fetch("/api/auth/application/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    responses,
                    audio_url: extra?.audio_url !== undefined ? extra.audio_url : audioUrl,
                    pdf_url: extra?.pdf_url !== undefined ? extra.pdf_url : pdfUrl,
                }),
            })
        } catch (err: any) {
            setError(err?.message || "فشل الحفظ")
        } finally {
            setSaving(false)
        }
    }

    const submit = async () => {
        setSubmitting(true)
        setError(null)
        setSuccess(null)
        try {
            await fetch("/api/auth/application/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ responses, audio_url: audioUrl, pdf_url: pdfUrl }),
            })
            const res = await fetch("/api/auth/application/me/submit", { method: "POST" })
            const json = await res.json()
            if (!res.ok) {
                setError(json.error || "فشل الإرسال")
            } else {
                setSuccess(json.message || "تم استلام طلبك")
                await load()
            }
        } catch (err: any) {
            setError(err?.message || "فشل الإرسال")
        } finally {
            setSubmitting(false)
        }
    }

    const reapply = async () => {
        setReapplying(true)
        setError(null)
        try {
            const res = await fetch("/api/auth/reapply", { method: "POST" })
            const j = await res.json().catch(() => ({}))
            if (!res.ok) {
                // Admin has explicitly blocked this applicant
                if (j.blocked === true) {
                    setReapplyBlocked(true)
                }
                setError(j.error || "فشل إعادة التقديم")
            } else {
                await load()
            }
        } finally {
            setReapplying(false)
        }
    }

    const logout = async () => {
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => { })
        router.push("/login")
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0B3D2E]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[#D4A843]" />
                    <p className="text-white/50 text-sm">جاري تحميل بيانات طلبك...</p>
                </div>
            </div>
        )
    }

    // =============================================
    // حالة: فشل تحميل البيانات
    // =============================================
    if (!data) {
        return (
            <div dir="rtl" className="min-h-screen flex items-center justify-center px-4 bg-[#0B3D2E]">
                <div className="w-full max-w-md bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl p-8 space-y-5 text-center">
                    <div className="mx-auto w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <AlertCircle className="w-7 h-7 text-red-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">تعذّر تحميل بيانات طلبك</h1>
                        <p className="text-sm text-white/50 mt-2">
                            {error || "حدث خطأ غير متوقع. حاول مرة أخرى أو سجّل الخروج وادخل مجددًا."}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={() => { setLoading(true); load() }} className="flex-1 px-4 py-2.5 bg-[#D4A843] hover:bg-[#C49A3A] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                            <RefreshCcw className="w-4 h-4" /> إعادة المحاولة
                        </button>
                        <button onClick={logout} className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                            <LogOut className="w-4 h-4" /> تسجيل الخروج
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const status = data.user.approval_status
    const app = data.application
    const isSubmitted = !!app?.submitted_at && status === "pending_approval" && app?.status !== "draft"
    const isPending = status === "pending_approval"
    const isRejected = status === "rejected"
    const roleLabel = data.user.role === "teacher" ? "أستاذ" : "مقرئ"

    // =============================================
    // حالة: مرفوض (Rejected) — صفحة احترافية واضحة
    // =============================================
    if (isRejected && !reapplying) {
        return (
            <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#0B3D2E] relative overflow-hidden">
                {/* Background decorations */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-32 -right-32 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
                    <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#D4A843]/5 rounded-full blur-3xl" />
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle, #D4A843 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
                </div>

                {/* Nav */}
                <nav className="absolute top-0 left-0 right-0 p-5 flex justify-between items-center z-10 max-w-4xl mx-auto w-full">
                    <img src="/branding/main-logo.png" alt="Logo" className="h-12 w-auto object-contain" />
                    <button onClick={logout} className="flex items-center gap-2 px-4 py-2 text-sm text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                        <LogOut className="w-4 h-4" /> خروج
                    </button>
                </nav>

                <div className="relative z-10 w-full max-w-lg">
                    {/* Rejection card */}
                    <div className="bg-white/5 backdrop-blur-xl border border-red-500/20 rounded-3xl shadow-2xl overflow-hidden">
                        {/* Red top accent */}
                        <div className="h-1.5 w-full bg-gradient-to-l from-red-500 to-red-700" />

                        <div className="p-8 md:p-10 text-center space-y-6">
                            {/* Icon */}
                            <div className="relative inline-flex">
                                <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto">
                                    <XCircle className="w-10 h-10 text-red-400" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#0B3D2E] border-2 border-red-500/30 flex items-center justify-center">
                                    <BookOpen className="w-3.5 h-3.5 text-red-400" />
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <p className="text-red-400/70 text-xs font-bold tracking-[0.2em] uppercase mb-2">قرار الإدارة</p>
                                <h1 className="text-3xl font-black text-white mb-2">تم رفض طلبك</h1>
                                <p className="text-white/50 text-base">
                                    للأسف لم يتم قبول طلب انضمامك <span className="text-[#D4A843]">كـ{roleLabel}</span> في هذه المرحلة
                                </p>
                            </div>

                            {/* Rejection reason box */}
                            {app?.rejection_reason ? (
                                <div className="bg-red-950/30 border border-red-500/20 rounded-2xl p-5 text-right space-y-2">
                                    <p className="text-xs font-black text-red-400/80 tracking-wider uppercase flex items-center gap-2">
                                        <span className="w-5 h-0.5 bg-red-400/40 block" />
                                        سبب الرفض
                                        <span className="w-5 h-0.5 bg-red-400/40 block" />
                                    </p>
                                    <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                                        {app.rejection_reason}
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-center">
                                    <p className="text-white/30 text-sm">
                                        لم يُذكر سبب محدد. يمكنك التواصل مع الإدارة لمزيد من التفاصيل.
                                    </p>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3 text-sm text-red-300 flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-col gap-3 pt-2">
                                {reapplyBlocked ? (
                                    /* Admin explicitly blocked this applicant */
                                    <div className="bg-orange-950/30 border border-orange-500/30 rounded-2xl p-5 text-center space-y-2">
                                        <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto">
                                            <Ban className="w-5 h-5 text-orange-400" />
                                        </div>
                                        <p className="text-orange-300 font-bold text-sm">تم إيقاف إمكانية إعادة التقديم</p>
                                        <p className="text-white/30 text-xs leading-relaxed">
                                            قررت الإدارة إيقاف إمكانية إعادة تقديم الطلب على هذا الحساب. يرجى التواصل مع الإدارة مباشرة للاستفسار.
                                        </p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={reapply}
                                        disabled={reapplying}
                                        className="w-full px-6 py-4 bg-[#D4A843] hover:bg-[#C49A3A] disabled:opacity-50 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.01] shadow-lg shadow-[#D4A843]/10"
                                    >
                                        {reapplying ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCcw className="w-5 h-5" />}
                                        {reapplying ? "جاري تحديث الطلب..." : "إعادة التقديم مرة أخرى"}
                                    </button>
                                )}

                                <button
                                    onClick={logout}
                                    className="w-full px-6 py-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/60 hover:text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all"
                                >
                                    <LogOut className="w-4 h-4" /> تسجيل الخروج
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer note */}
                    <p className="text-center text-white/20 text-xs mt-6">
                        هل لديك أي استفسار؟ تواصل مع إدارة المنصة عبر قنوات الدعم الرسمية
                    </p>
                </div>
            </div>
        )
    }

    // =============================================
    // حالة: إعادة التقديم بعد الرفض
    // =============================================
    return (
        <div className="min-h-screen bg-[#0B3D2E] py-8 px-4" dir="rtl">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-32 right-0 w-96 h-96 bg-[#D4A843]/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
            </div>

            <div className="max-w-4xl mx-auto space-y-6 relative z-10">
                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={logout}
                            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
                        >
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-white">
                                {data.user.role === "teacher" ? "طلب الانضمام كأستاذ" : "طلب الانضمام كمقرئ"}
                            </h1>
                            <p className="text-sm text-white/40 mt-0.5">
                                {isSubmitted ? "طلبك قيد المراجعة" : isRejected ? "إعادة تعبئة الطلب بعد الرفض" : "أكمل البيانات لإرسال طلبك"}
                            </p>
                        </div>
                    </div>
                    <button onClick={logout} className="flex items-center gap-2 px-4 py-2 text-sm text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                        <LogOut className="w-4 h-4" /> خروج
                    </button>
                </header>

                {/* Progress timeline */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between gap-2 relative">
                        <div className="absolute top-5 right-0 left-0 h-0.5 bg-white/10 -z-0" />
                        <Step done={true} current={!isSubmitted && !isRejected} label="التسجيل" icon={<CheckCircle2 className="w-5 h-5" />} />
                        <Step done={isSubmitted || isRejected || (!!app && app.status !== "draft")} current={!isSubmitted && !isRejected && !!app} label="استكمال البيانات" icon={<Edit3 className="w-5 h-5" />} />
                        <Step done={isSubmitted} current={isSubmitted && !isRejected} label="مراجعة الإدارة" icon={<Clock className="w-5 h-5" />} />
                        <Step done={false} current={false} label="القبول" icon={<CheckCircle2 className="w-5 h-5" />} error={isRejected} errorIcon={<XCircle className="w-5 h-5" />} />
                    </div>
                </div>

                {/* Pending banner */}
                {isSubmitted && !isRejected && (
                    <div className="bg-amber-900/20 border-2 border-amber-500/30 rounded-2xl p-5 flex items-start gap-4">
                        <Clock className="w-6 h-6 text-amber-400 mt-1 shrink-0" />
                        <div className="flex-1">
                            <h2 className="font-bold text-amber-300">طلبك قيد المراجعة</h2>
                            <p className="text-sm text-amber-400/70 mt-1">
                                تم إرسال طلبك بنجاح. سيقوم فريق الإدارة بمراجعة بياناتك في أقرب وقت ممكن.
                            </p>
                            <p className="text-xs text-amber-500/50 mt-2">
                                تاريخ الإرسال: {app?.submitted_at ? new Date(app.submitted_at).toLocaleString("ar-EG") : "—"}
                            </p>
                        </div>
                    </div>
                )}

                {/* Application form */}
                {!isSubmitted && (
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 md:p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-lg text-white flex items-center gap-2">
                                <Send className="w-5 h-5 text-[#D4A843]" /> نموذج طلب الانضمام
                            </h2>
                            {saving && <span className="text-xs text-white/30 flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" /> جاري الحفظ
                            </span>}
                        </div>

                        {data.questions.length === 0 && (
                            <div className="bg-white/[0.03] rounded-xl p-4 text-sm text-white/30">
                                لم يتم إعداد نموذج الطلب بعد من قبل الإدارة. يرجى التواصل مع الدعم.
                            </div>
                        )}

                        {data.questions.map((q, i) => (
                            <div key={q.id} className="space-y-2">
                                <label className="block">
                                    <span className="text-sm font-bold text-white/90 flex items-center gap-2">
                                        <span className="bg-[#D4A843]/10 text-[#D4A843] text-xs w-6 h-6 rounded-full flex items-center justify-center">{i + 1}</span>
                                        {q.label}
                                        {q.is_required && <span className="text-red-400">*</span>}
                                    </span>
                                    {q.description && <span className="block text-xs text-white/30 mt-1">{q.description}</span>}
                                </label>
                                {q.type === "text" && (
                                    <input type="text" value={responses[q.id] || ""} onChange={e => setResponses({ ...responses, [q.id]: e.target.value })} onBlur={() => saveDraft()} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#D4A843]/20 outline-none text-white placeholder:text-white/20" />
                                )}
                                {q.type === "textarea" && (
                                    <textarea value={responses[q.id] || ""} onChange={e => setResponses({ ...responses, [q.id]: e.target.value })} onBlur={() => saveDraft()} rows={4} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#D4A843]/20 outline-none resize-y text-white placeholder:text-white/20" />
                                )}
                                {q.type === "select" && (
                                    <select value={responses[q.id] || ""} onChange={e => { setResponses({ ...responses, [q.id]: e.target.value }); saveDraft() }} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#D4A843]/20 outline-none text-white">
                                        <option value="">— اختر —</option>
                                        {(q.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                )}
                                {q.type === "audio" && (
                                    <AudioRecorder value={audioUrl} onChange={(u) => { setAudioUrl(u); saveDraft({ audio_url: u }) }} />
                                )}
                                {q.type === "file" && (
                                    <PdfUploader value={pdfUrl} onChange={(u) => { setPdfUrl(u); saveDraft({ pdf_url: u }) }} />
                                )}
                            </div>
                        ))}

                        {error && (
                            <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-3 text-sm text-red-300 flex items-start gap-2 whitespace-pre-line">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-3 text-sm text-emerald-300 flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                                {success}
                            </div>
                        )}

                        <button
                            onClick={submit}
                            disabled={submitting || data.questions.length === 0}
                            className="w-full px-4 py-3.5 bg-[#D4A843] hover:bg-[#C49A3A] disabled:opacity-50 text-white font-black rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            إرسال الطلب للمراجعة
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

function Step({ done, current, label, icon, error, errorIcon }: {
    done: boolean; current: boolean; label: string; icon: React.ReactNode;
    error?: boolean; errorIcon?: React.ReactNode
}) {
    const bg = error
        ? "bg-red-500/20 text-red-400 border-red-500/40"
        : done
            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
            : current
                ? "bg-[#D4A843]/20 text-[#D4A843] border-[#D4A843]/40"
                : "bg-white/5 text-white/30 border-white/10"
    return (
        <div className="flex flex-col items-center gap-2 z-10 flex-1">
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${bg}`}>
                {error ? errorIcon : icon}
            </div>
            <span className={`text-xs font-bold text-center ${current ? "text-white/80" : "text-white/30"}`}>
                {label}
            </span>
        </div>
    )
}
