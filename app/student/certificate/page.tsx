"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useI18n } from "@/lib/i18n/context"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, Award, User, MapPin, Building, FileText, ArrowLeft, Loader2, Info, CheckCircle } from "lucide-react"

export default function CertificatePage() {
  const router = useRouter()
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    university: "",
    university_other: "",
    college: "",
    college_other: "",
    city: "",
    city_other: "",
    entity_id: "",
    entity_other: "",
    phone: "",
    age: "",
    certificate_photo_url: ""
  })

  const [universities, setUniversities] = useState<string[]>([])
  const [entities, setEntities] = useState<{ id: string, name: string }[]>([])
  const [studentName, setStudentName] = useState("")
  const [serialCode, setSerialCode] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/certificate?t=${Date.now()}`)
        if (res.ok) {
          const data = await res.json()
          const eligibleStatuses = ['mastered', 'session_booked']
          if (!data.certificateEnabled || !eligibleStatuses.includes(data.recitationStatus)) {
            router.push("/student")
            return
          }
          if (data.certificate) {
            const predefinedUniversities = data.universities || t.student.universities || []
            const predefinedColleges = ["كلية الشريعة", "كلية الطب", "كلية الهندسة", "كلية علوم الحاسب"]
            const predefinedCities = ["الرياض", "جدة", "مكة المكرمة", "المدينة المنورة", "الدمام"]

            const dbUniv = data.certificate.university || ""
            const dbColl = data.certificate.college || ""
            const dbCity = data.certificate.city || ""

            const isUnivOther = dbUniv && !predefinedUniversities.includes(dbUniv)
            const isCollOther = dbColl && !predefinedColleges.includes(dbColl)
            const isCityOther = dbCity && !predefinedCities.includes(dbCity)

            setFormData({
              university: isUnivOther ? "أخرى" : dbUniv,
              university_other: isUnivOther ? dbUniv : "",
              college: isCollOther ? "أخرى" : dbColl,
              college_other: isCollOther ? dbColl : "",
              city: isCityOther ? "أخرى" : dbCity,
              city_other: isCityOther ? dbCity : "",
              entity_id: data.certificate.entity_id ? data.certificate.entity_id : (data.certificate.entity_other ? "other" : ""),
              entity_other: data.certificate.entity_other || "",
              phone: data.certificate.phone || "",
              age: data.certificate.age ? data.certificate.age.toString() : "",
              certificate_photo_url: data.certificate.certificate_photo_url || ""
            })


            if (data.certificate.serial_code) {
              setSerialCode(data.certificate.serial_code)
            }
            if (data.certificate.student_name) {
              setStudentName(data.certificate.student_name)
            }
            if (data.universities) setUniversities(data.universities)
            if (data.entities) setEntities(data.entities)
            if (data.certificate.certificate_issued) {
              setSuccess(true)
            }
          } else {
            if (data.universities) setUniversities(data.universities)
            if (data.entities) setEntities(data.entities)
          }
        } else {
          setError(t.student.serverError)
        }
      } catch (err) {
        setError(t.student.serverError)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const payload = {
        university: formData.university === 'أخرى' ? formData.university_other : formData.university,
        college: formData.college === 'أخرى' ? formData.college_other : formData.college,
        city: formData.city === 'أخرى' ? formData.city_other : formData.city,
        entity_id: formData.entity_id === 'other' ? null : formData.entity_id,
        entity_other: formData.entity_id === 'other' ? formData.entity_other : null,
        phone: formData.phone,
        age: formData.age,
        certificate_photo_url: formData.certificate_photo_url || null,
      }

      const res = await fetch("/api/certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const data = await res.json()
        if (data.certificate?.serial_code) setSerialCode(data.certificate.serial_code)
        setSuccess(true)
      } else {
        const data = await res.json()
        setError(data.error || t.student.submitError)
      }
    } catch {
      setError(t.student.serverError)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1B5E3B]" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen -mt-10 pt-10 px-4">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-[#C9A227]/5 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -left-[10%] w-[30%] h-[30%] bg-[#1B5E3B]/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
          <Link href="/student" className="hover:text-[#1B5E3B] transition-colors">{t.student.dashboard}</Link>
          <ChevronLeft className="w-3 h-3 rotate-180" />
          <span className="text-[#1B5E3B] opacity-80">{t.student.certificate}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-right">
          <div className="relative p-5 bg-gradient-to-br from-[#C9A227] to-[#A6841E] rounded-3xl shadow-xl shadow-[#C9A227]/20 transform hover:scale-110 transition-transform duration-500 shrink-0">
            <Award className="w-10 h-10 text-white" />
            <div className="absolute -inset-1 bg-white/20 dark:bg-black/20 rounded-3xl blur-md -z-10 animate-pulse" />
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight leading-tight">{t.student.certificateTitle}</h1>
            <p className="text-muted-foreground text-lg mt-2 font-medium">{t.student.issueCertificateDesc}</p>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-[1px] bg-gradient-to-br from-white/40 to-transparent dark:from-white/10 dark:to-transparent rounded-[2.5rem] blur-[1px] -z-10" />
          <div className="bg-card/70 backdrop-blur-xl rounded-[2.5rem] border border-border shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] overflow-hidden">

            {success ? (
              <div className="p-16 text-center animate-in zoom-in-95 duration-500">
                <div className="relative w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Award className="w-12 h-12 text-emerald-600 animate-bounce" />
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-100 dark:border-emerald-500/20 animate-ping" />
                </div>
                <h2 className="text-3xl font-black text-foreground mb-4">{t.student.certificateSuccessTitle}</h2>
                <p className="text-muted-foreground text-lg max-w-sm mx-auto leading-relaxed">{t.student.certificateSuccessDesc}</p>
                {serialCode && (
                  <div className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-[#1B5E3B]/10 border border-[#1B5E3B]/20 rounded-2xl">
                    <CheckCircle className="w-4 h-4 text-[#1B5E3B]" />
                    <span className="font-mono font-bold text-[#1B5E3B] text-sm tracking-widest">{serialCode}</span>
                  </div>
                )}
                <div className="pt-10">
                  <Link href="/student" className="inline-flex items-center gap-3 bg-gradient-to-r from-[#1B5E3B] to-[#2D8C5B] hover:from-[#124028] hover:to-[#1B5E3B] text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-lg shadow-[#1B5E3B]/20 hover:shadow-xl hover:-translate-y-1">
                    {t.student.backToDashboard}
                    <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
                {error && (
                  <div className="bg-red-50/80 backdrop-blur-sm text-red-700 p-5 rounded-2xl text-sm border border-red-100 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    {error}
                  </div>
                )}

                <div className="bg-[#1B5E3B]/5 p-5 rounded-2xl border border-[#1B5E3B]/10 flex items-start gap-4">
                  <div className="p-2 bg-card rounded-lg shadow-sm border border-border">
                    <Info className="w-5 h-5 text-[#1B5E3B]" />
                  </div>
                  <p className="text-sm text-[#1B5E3B] dark:text-[#2D8C5B] font-medium leading-relaxed">
                    {t.student.certificateHint || "يرجى التأكد من صحة البيانات المدخلة، حيث سيتم طباعتها على الشهادة الرسمية الخاصة بك."}
                  </p>
                </div>



                <div className="space-y-12">
                  {/* Academic Info Group */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-1.5 h-6 bg-[#1B5E3B] rounded-full" />
                      <h2 className="text-xl font-bold text-foreground">{isAr ? "البيانات الأكاديمية" : "Academic Information"}</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      {/* University */}
                      <div className="space-y-3">
                        <label className="block text-sm font-bold text-muted-foreground px-1 uppercase tracking-wide">{t.student.universityLabel}</label>
                        <div className="relative group/field">
                          <Building className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 transition-colors group-focus-within/field:text-[#1B5E3B]" />
                          <select
                            name="university"
                            value={formData.university}
                            onChange={handleChange}
                            required
                            className="w-full pl-6 pr-12 py-4 bg-muted/30 border border-border rounded-2xl focus:ring-4 focus:ring-[#1B5E3B]/10 focus:border-[#1B5E3B] transition-all text-sm appearance-none font-medium text-foreground"
                          >
                            <option value="" className="bg-card">{t.student.selectUniversity}</option>
                            {universities.length > 0 ? universities.map((u) => (
                              <option key={u} value={u} className="bg-card">{u}</option>
                            )) : t.student.universities.map((u: string) => (
                              <option key={u} value={u} className="bg-card">{u}</option>
                            ))}
                            <option value="أخرى" className="bg-card">{t.student.other}</option>
                          </select>
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronLeft className="w-4 h-4 -rotate-90" />
                          </div>
                        </div>
                        {formData.university === 'أخرى' && (
                          <input type="text" name="university_other" value={formData.university_other} onChange={handleChange}
                            placeholder={t.student.otherPlaceholder} required
                            className="w-full px-6 py-4 bg-card border border-border rounded-2xl focus:ring-4 focus:ring-[#1B5E3B]/10 focus:border-[#1B5E3B] text-sm shadow-sm font-medium text-foreground" />
                        )}
                      </div>

                      {/* College */}
                      <div className="space-y-3">
                        <label className="block text-sm font-bold text-muted-foreground px-1 uppercase tracking-wide">{t.student.collegeLabel}</label>
                        <div className="relative group/field">
                          <FileText className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 transition-colors group-focus-within/field:text-[#1B5E3B]" />
                          <select
                            name="college"
                            value={formData.college}
                            onChange={handleChange}
                            required
                            className="w-full pl-6 pr-12 py-4 bg-muted/30 border border-border rounded-2xl focus:ring-4 focus:ring-[#1B5E3B]/10 focus:border-[#1B5E3B] transition-all text-sm appearance-none font-medium text-foreground"
                          >
                            <option value="" className="bg-card">{t.student.collegePlaceholder}</option>
                            <option value="كلية الشريعة" className="bg-card">كلية الشريعة</option>
                            <option value="كلية الطب" className="bg-card">كلية الطب</option>
                            <option value="كلية الهندسة" className="bg-card">كلية الهندسة</option>
                            <option value="كلية علوم الحاسب" className="bg-card">كلية علوم الحاسب</option>
                            <option value="أخرى" className="bg-card">{t.student.other}</option>
                          </select>
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronLeft className="w-4 h-4 -rotate-90" />
                          </div>
                        </div>
                        {formData.college === 'أخرى' && (
                          <input type="text" name="college_other" value={formData.college_other} onChange={handleChange}
                            placeholder={t.student.otherPlaceholder} required
                            className="w-full px-6 py-4 bg-card border border-border rounded-2xl focus:ring-4 focus:ring-[#1B5E3B]/10 focus:border-[#1B5E3B] text-sm shadow-sm font-medium text-foreground" />
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Personal & Residency Group */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-1.5 h-6 bg-[#C9A227] rounded-full" />
                      <h2 className="text-xl font-bold text-foreground">{isAr ? "بيانات السكن والتواصل" : "Residency & Contact"}</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      {/* City */}
                      <div className="space-y-3">
                        <label className="block text-sm font-bold text-muted-foreground px-1 uppercase tracking-wide">{t.student.cityLabel}</label>
                        <div className="relative group/field">
                          <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 transition-colors group-focus-within/field:text-[#1B5E3B]" />
                          <select
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            required
                            className="w-full pl-6 pr-12 py-4 bg-muted/30 border border-border rounded-2xl focus:ring-4 focus:ring-[#1B5E3B]/10 focus:border-[#1B5E3B] transition-all text-sm appearance-none font-medium text-foreground"
                          >
                            <option value="" className="bg-card">{t.student.cityPlaceholder}</option>
                            <option value="الرياض" className="bg-card">الرياض</option>
                            <option value="جدة" className="bg-card">جدة</option>
                            <option value="مكة المكرمة" className="bg-card">مكة المكرمة</option>
                            <option value="المدينة المنورة" className="bg-card">المدينة المنورة</option>
                            <option value="الدمام" className="bg-card">الدمام</option>
                            <option value="أخرى" className="bg-card">{t.student.other}</option>
                          </select>
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronLeft className="w-4 h-4 -rotate-90" />
                          </div>
                        </div>
                        {formData.city === 'أخرى' && (
                          <input type="text" name="city_other" value={formData.city_other} onChange={handleChange}
                            placeholder={t.student.otherPlaceholder} required
                            className="w-full px-6 py-4 bg-card border border-border rounded-2xl focus:ring-4 focus:ring-[#1B5E3B]/10 focus:border-[#1B5E3B] text-sm shadow-sm font-medium text-foreground" />
                        )}
                      </div>

                      {/* Phone */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-end px-1">
                          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wide">{t.student.mobileLabel}</label>
                          <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold">{isAr ? "اختياري" : "OPTIONAL"}</span>
                        </div>
                        <div className="relative group/field">
                          <User className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 transition-colors group-focus-within/field:text-[#1B5E3B]" />
                          <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                            placeholder="05xxxxxxxx"
                            className="w-full pl-6 pr-12 py-4 bg-muted/30 border border-border rounded-2xl focus:ring-4 focus:ring-[#1B5E3B]/10 focus:border-[#1B5E3B] transition-all text-sm text-left font-medium text-foreground"
                            dir="ltr" />
                        </div>
                      </div>

                      {/* Age */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-end px-1">
                          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wide">{t.student.ageLabel}</label>
                          <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold">{isAr ? "اختياري" : "OPTIONAL"}</span>
                        </div>
                        <div className="relative group/field">
                          <Info className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                          <input type="number" name="age" value={formData.age} onChange={handleChange}
                            placeholder="25"
                            className="w-full pl-6 pr-12 py-4 bg-muted/30 border border-border rounded-2xl focus:ring-4 focus:ring-[#1B5E3B]/10 focus:border-[#1B5E3B] transition-all text-sm font-medium text-foreground" />
                        </div>
                      </div>

                      {/* Authorized Entity */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-end px-1">
                          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wide">{isAr ? "الجهة المعتمدة" : "Authorized Entity"}</label>
                          <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold">{isAr ? "اختياري" : "OPTIONAL"}</span>
                        </div>
                        <div className="relative group/field">
                          <Building className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 transition-colors group-focus-within/field:text-[#1B5E3B]" />
                          <select
                            name="entity_id"
                            value={formData.entity_id}
                            onChange={handleChange}
                            className="w-full pl-6 pr-12 py-4 bg-muted/30 border border-border rounded-2xl focus:ring-4 focus:ring-[#1B5E3B]/10 focus:border-[#1B5E3B] transition-all text-sm appearance-none font-medium text-foreground"
                          >
                            <option value="" className="bg-card">{isAr ? "اختر الجهة" : "Select Entity"}</option>
                            {entities.map((e) => (
                              <option key={e.id} value={e.id} className="bg-card">{e.name}</option>
                            ))}
                            <option value="other" className="bg-card">{t.student.other}</option>
                          </select>
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                            <ChevronLeft className="w-4 h-4 -rotate-90" />
                          </div>
                        </div>
                        {formData.entity_id === 'other' && (
                          <input type="text" name="entity_other" value={formData.entity_other} onChange={handleChange}
                            placeholder={t.student.otherPlaceholder} required
                            className="w-full px-6 py-4 bg-card border border-border rounded-2xl focus:ring-4 focus:ring-[#1B5E3B]/10 focus:border-[#1B5E3B] text-sm shadow-sm font-medium text-foreground" />
                        )}
                      </div>
                    </div>
                  </section>
                </div>

                {/* Submit */}
                <div className="pt-10 border-t border-border flex flex-col items-center">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="group relative w-full md:w-80 flex justify-center items-center gap-3 py-5 px-8 rounded-2xl shadow-[0_20px_40px_-10px_rgba(201,162,39,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(201,162,39,0.4)] text-white bg-gradient-to-r from-[#C9A227] to-[#A6841E] focus:outline-none focus:ring-4 focus:ring-[#C9A227]/20 font-black text-lg transition-all disabled:opacity-50 overflow-hidden active:scale-95"
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {submitting ? (
                      <><Loader2 className="w-6 h-6 animate-spin" /> {t.student.savingData}</>
                    ) : (
                      <>{t.student.saveData} <ArrowLeft className="w-5 h-5 rtl:rotate-180 group-hover:-translate-x-1 transition-transform" /></>
                    )}
                  </button>
                  <p className="mt-4 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                    {isAr ? "جميع البيانات سيتم مراجعتها قبل الإصدار" : "All data will be reviewed before issuance"}
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Support */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-8 bg-slate-900 border border-white/5 rounded-[2rem] text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A227]/10 blur-[50px] rounded-full" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-[#C9A227]/20 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-[#C9A227]" />
            </div>
            <div>
              <h4 className="font-bold text-lg">{isAr ? "هل لديك استفسار؟" : "Have a question?"}</h4>
              <p className="text-white/60 text-sm">{isAr ? "تواصل مع الدعم الفني للمنصة." : "Contact our support team."}</p>
            </div>
          </div>
          <Link href="/support" className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all relative z-10 backdrop-blur-md border border-white/10">
            {isAr ? "الدعم الفني" : "Technical Support"}
          </Link>
        </div>
      </div>
    </div>
  )
}
