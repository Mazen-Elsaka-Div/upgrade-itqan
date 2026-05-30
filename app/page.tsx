"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { motion, useScroll, useTransform, AnimatePresence, useInView } from "framer-motion"
import {
  BookOpen,
  GraduationCap,
  ArrowLeft,
  Menu,
  X,
  Star,
  Award,
  Users,
  Mic,
  Calendar,
  ScrollText,
  Sparkles,
  Quote,
  ChevronDown,
  Sun,
  Moon,
} from "lucide-react"

/* ============================================================
   ISLAMIC ORNAMENTAL SVG COMPONENTS
   ============================================================ */

const OrnamentDivider = ({ className = "", color = "currentColor" }: { className?: string; color?: string }) => (
  <svg viewBox="0 0 400 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <line x1="0" y1="20" x2="140" y2="20" stroke={color} strokeWidth="0.5" opacity="0.4" />
    <line x1="260" y1="20" x2="400" y2="20" stroke={color} strokeWidth="0.5" opacity="0.4" />
    <g transform="translate(200,20)">
      <circle r="14" stroke={color} strokeWidth="0.6" fill="none" opacity="0.6" />
      <circle r="8" stroke={color} strokeWidth="0.6" fill="none" opacity="0.5" />
      <g stroke={color} strokeWidth="0.6" opacity="0.7">
        <line x1="-18" y1="0" x2="-26" y2="0" />
        <line x1="18" y1="0" x2="26" y2="0" />
        <line x1="0" y1="-18" x2="0" y2="-26" />
        <line x1="0" y1="18" x2="0" y2="26" />
      </g>
      <circle r="2" fill={color} opacity="0.8" />
    </g>
  </svg>
)

const EightStar = ({ size = 60, className = "", color = "currentColor", strokeWidth = 0.8 }: any) => (
  <svg viewBox="-50 -50 100 100" width={size} height={size} className={className} fill="none" stroke={color} strokeWidth={strokeWidth} aria-hidden>
    <polygon points="0,-40 11,-11 40,0 11,11 0,40 -11,11 -40,0 -11,-11" />
    <polygon points="0,-28 8,-8 28,0 8,8 0,28 -8,8 -28,0 -8,-8" transform="rotate(22.5)" />
    <circle r="6" />
  </svg>
)

const ArchFrame = ({ className = "", color = "currentColor" }: any) => (
  <svg viewBox="0 0 200 280" className={className} fill="none" stroke={color} strokeWidth="0.8" aria-hidden preserveAspectRatio="none">
    <path d="M 10 280 L 10 100 Q 10 10 100 10 Q 190 10 190 100 L 190 280" />
    <path d="M 24 280 L 24 105 Q 24 24 100 24 Q 176 24 176 105 L 176 280" opacity="0.5" />
  </svg>
)

const ArabesqueCorner = ({ size = 100, className = "", color = "currentColor" }: any) => (
  <svg viewBox="0 0 100 100" width={size} height={size} className={className} fill="none" stroke={color} strokeWidth="0.7" aria-hidden>
    <path d="M 0 0 L 100 0 L 100 30 Q 70 30 70 60 Q 70 100 30 100 L 0 100 Z" opacity="0.15" fill={color} />
    <path d="M 0 0 L 100 0 L 100 30 Q 70 30 70 60 Q 70 100 30 100 L 0 100" />
    <path d="M 20 0 Q 20 50 50 50 Q 80 50 80 30" opacity="0.6" />
    <circle cx="50" cy="50" r="3" fill={color} />
    <circle cx="20" cy="20" r="1.5" fill={color} />
    <circle cx="80" cy="20" r="1.5" fill={color} />
  </svg>
)

const TessellatedBg = ({ className = "", color = "var(--hp-navy)", opacity = 0.04, id = "navy" }: any) => {
  const patternId = `tess-${id}`
  return (
    <svg className={className} aria-hidden>
      <defs>
        <pattern id={patternId} x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <g fill="none" stroke={color} strokeWidth="0.6" opacity={opacity * 12}>
            <polygon points="40,5 47,33 75,40 47,47 40,75 33,47 5,40 33,33" />
            <circle cx="40" cy="40" r="22" />
            <circle cx="40" cy="40" r="3" fill={color} />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  )
}

/* ============================================================
   ANIMATION HELPERS
   ============================================================ */

function Reveal({ children, delay = 0, y = 40, className = "" }: any) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function CountUp({ value, suffix = "", duration = 2 }: { value: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!inView) return
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min((now - start) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setN(Math.floor(eased * value))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, duration])
  return <span ref={ref}>{n.toLocaleString("ar-EG")}{suffix}</span>
}

/* ============================================================
   TESTIMONIALS MARQUEE
   ============================================================ */

type Testimonial = { q: string; n: string; r: string }

function TestimonialCard({ q, n, r }: Testimonial) {
  return (
    <article
      dir="rtl"
      className="ml-6 flex-shrink-0 w-[320px] md:w-[420px] relative p-8 md:p-10 bg-hp-card dark:bg-hp-dark-2 border border-hp-navy/10 dark:border-hp-gold/15 rounded-2xl"
    >
      <Quote className="absolute top-6 left-6 w-8 h-8 text-hp-bronze/20 dark:text-hp-gold/30 rotate-180" />
      <ArabesqueCorner size={70} className="absolute top-0 right-0 text-hp-bronze/15 dark:text-hp-gold/25" />
      <div className="relative pt-4">
        <p
          className="text-base md:text-lg text-hp-ink/85 dark:text-hp-cream/85 leading-loose mb-6 line-clamp-4"
          style={{ fontFamily: "var(--font-quran)" }}
        >
          {q}
        </p>
        <div className="pt-4 border-t border-hp-navy/10 dark:border-hp-gold/15">
          <div className="font-bold text-hp-navy dark:text-hp-cream" style={{ fontFamily: "var(--font-quran)" }}>
            {n}
          </div>
          <div className="text-sm text-hp-ink/55 dark:text-hp-cream/55 mt-1">{r}</div>
        </div>
        <div className="flex gap-1 mt-3">
          {[...Array(5)].map((_, k) => (
            <Star key={k} className="w-3.5 h-3.5 fill-hp-bronze dark:fill-hp-gold text-hp-bronze dark:text-hp-gold" />
          ))}
        </div>
      </div>
    </article>
  )
}

function MarqueeRow({
  items,
  direction,
  duration,
}: {
  items: Testimonial[]
  direction: "right" | "left"
  duration: number
}) {
  // Duplicate items so -50% translation lands exactly on the second copy → seamless loop.
  const doubled = [...items, ...items]
  const keyframes = direction === "right" ? "itqan-marquee-right" : "itqan-marquee-left"
  return (
    <div className="overflow-hidden" dir="ltr">
      <div
        className="marquee-track flex w-max"
        style={{
          animationName: keyframes,
          animationDuration: `${duration}s`,
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
        }}
      >
        {doubled.map((t, i) => (
          <TestimonialCard key={i} {...t} />
        ))}
      </div>
    </div>
  )
}

function TestimonialsMarquee() {
  const rowTop: Testimonial[] = [
    { q: "تجربةٌ أعادتْ لي شَغفي بالقرآن، فالأستاذُ يُتابعُ تِلاوتي حرفًا حرفًا، وأنا في بيتي.", n: "أحمد المصري", r: "طالبٌ في مسارِ الإجازة" },
    { q: "حفظتُ ربعَ القرآن في ستَّةِ أشهرٍ بفضلِ المتابعةِ المُنظَّمةِ والمُقرئةِ المُتميِّزة.", n: "فاطمة الزهراء", r: "طالبةُ تحفيظ" },
    { q: "الجَودةُ، التَّنظيمُ، الاحترامُ في التعامل، كلُّ شيءٍ يَدلُّ على أنَّ القائمين أهلُ علمٍ وصِدق.", n: "د. خالد الأنصاري", r: "وَلِيُّ أمر" },
    { q: "ما مرَّ يومٌ بعد التحاقي بالمَقْرأة إلا وذُقتُ حلاوةَ القرآنِ من جديد.", n: "محمد العبسي", r: "طالبُ تجويد" },
    { q: "المنصَّةُ راقيةٌ، والأساتذةُ مُجازون، والإدارةُ تَسمعُ لكلِّ مُلاحظةٍ بِصَدرٍ رَحب.", n: "أم عبد الله", r: "وَلِيَّةُ أمر" },
    { q: "أَخذتُ إجازتي في رواية حفصٍ هنا، بعد سنواتٍ من التشتُّتِ بين منصَّاتٍ أخرى.", n: "يوسف الإدريسي", r: "حاصلٌ على إجازة" },
    { q: "الجلساتُ المباشرةُ فيها رُوحٌ لا تَجدُها في أيِّ تسجيلٍ مُسبَّق.", n: "سارة المغربي", r: "طالبةُ تجويد" },
    { q: "أَشعرُ أنَّ الأستاذَ يُكلِّمُني وحدي، كأنَّنا في حَلْقةٍ خاصَّة.", n: "طارق الزيات", r: "طالبٌ مبتدئ" },
    { q: "في أقلَّ من ثلاثةِ أشهرٍ صَحَّح لي المُقرئُ أخطاءً حملتُها سنين.", n: "رانيا عبد الحميد", r: "طالبةُ تحفيظ" },
    { q: "أجودُ ما قَضيتُه من وقتٍ هذا العام هو جلساتي في المَقْرأة.", n: "عمر سيد أحمد", r: "طالبٌ في الإجازة" },
    { q: "بعد سنواتٍ من البحثِ عن مُقرئٍ مُجاز، وجدتُ ضالَّتي هنا.", n: "عائشة الحربي", r: "طالبةُ إجازة" },
    { q: "أبنائي الثلاثةُ مُلتحقون بالأكاديميَّة ومستواهم في تَحسُّنٍ مُستمرّ.", n: "أبو يوسف", r: "وَلِيُّ أمر" },
  ]
  const rowBottom: Testimonial[] = [
    { q: "تجربةٌ مُختلفةٌ تمامًا، شعرتُ أنني في حَلْقةٍ حقيقيَّةٍ في أحدِ المساجدِ العَتيقة.", n: "هدى الشريف", r: "طالبةُ علم" },
    { q: "كنتُ أبحثُ عن مَقْرأةٍ مُنضَبطةٍ منذُ زمن، فوجدتُ هنا ما يَفوقُ ما تَمنَّيت.", n: "إبراهيم الرفاعي", r: "طالبٌ في الإجازة" },
    { q: "الواجباتُ مُحَكَّمة، والمُتابعةُ يوميَّة، والنتائجُ مُبشِّرةٌ بفضلِ الله.", n: "نوال البصري", r: "طالبةُ تحفيظ" },
    { q: "ما رأيتُ أَشمَلَ من هذه المنصَّةِ في الجَمعِ بين العلمِ النظريِّ والتطبيقيِّ.", n: "د. صالح الشمري", r: "أستاذٌ مُحاضِر" },
    { q: "ابني تَغيَّرت علاقتُه بالقرآنِ بعد التحاقِه، صار يَنتظرُ الجلسةَ بشَغف.", n: "أم محمد", r: "وَلِيَّةُ أمر" },
    { q: "خِدمةٌ مُتقَنةٌ من البدايةِ إلى النهاية، شُكرًا لكلِّ القائمين على هذا المشروع.", n: "عبد الرحمن الحارثي", r: "خرِّيج" },
    { q: "الانتظامُ في الجلساتِ جعلَ حفظي أمتنَ وتلاوتي أصفى من أيِّ وقتٍ مضى.", n: "منى القرشي", r: "طالبةُ تحفيظ" },
    { q: "المُقرئُ يَشرحُ المَخارجَ بأسلوبٍ واضحٍ لم أَجدْه في مكانٍ آخر.", n: "بلال حسين", r: "طالبُ تجويد" },
    { q: "من أفضلِ قراراتي الانضمامُ للأكاديميَّة، والنتائجُ تَتكلَّمُ عن نفسها.", n: "لينا الحمداني", r: "طالبةٌ في مسارِ الإجازة" },
    { q: "كلُّ جلسةٍ فيها علمٌ وأدبٌ وبركة، اللهُ يُجزي القائمين خيرًا.", n: "حسام الدين عوض", r: "طالبٌ متقدِّم" },
    { q: "تَعلَّمتُ أحكامَ التجويدِ بطريقةٍ سَلِسةٍ لم أتوقَّعها من قبل.", n: "مريم الأحمد", r: "طالبةُ تجويد" },
    { q: "المنصَّةُ سَهَّلت عليَّ الجَمعَ بين العملِ والدراسةِ القرآنيَّة.", n: "ماجد العنزي", r: "طالبٌ عامل" },
  ]

  return (
    <section id="voices" className="relative py-20 md:py-24 bg-hp-parchment dark:bg-hp-dark overflow-hidden transition-colors duration-500">
      <div className="container mx-auto px-6">
        <div className="text-center mb-10 md:mb-12">
          <span className="text-xs tracking-[0.35em] text-hp-bronze dark:text-hp-gold uppercase mb-4 block">آراؤهم</span>
          <h2
            className="text-5xl md:text-6xl font-bold text-hp-navy dark:text-hp-cream leading-tight"
            style={{ fontFamily: "var(--font-quran)" }}
          >
            كَلِماتٌ مِن طُلَّابِنا
          </h2>
        </div>
      </div>

      {/* Two-row marquee with edge fades */}
      <div className="relative space-y-5">
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 md:w-48 bg-gradient-to-l from-hp-parchment dark:from-hp-dark to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 md:w-48 bg-gradient-to-r from-hp-parchment dark:from-hp-dark to-transparent" />

        <MarqueeRow items={rowTop} direction="right" duration={60} />
        <MarqueeRow items={rowBottom} direction="left" duration={65} />
      </div>
    </section>
  )
}

/* ============================================================
   PAGE
   ============================================================ */

// Public homepage CMS settings shape (defaults match the original hardcoded
// strings so the page renders sensibly even before /api/homepage responds).
type HomepageSettings = {
  homepage_hero_title?: string
  homepage_hero_subtitle?: string
  homepage_hero_description?: string
  homepage_cta_primary_text?: string
  homepage_cta_primary_link?: string
  homepage_cta_secondary_text?: string
  homepage_cta_secondary_link?: string
  homepage_show_stats?: boolean | string
  homepage_show_features?: boolean | string
  homepage_show_testimonials?: boolean | string
  homepage_primary_color?: string
  homepage_accent_color?: string
  maintenance_mode?: boolean | string
  maintenance_message?: string
  maintenance_banner_color?: string
  maintenance_full_page?: boolean | string
}

const asBool = (v: any, fallback = true) => {
  if (v === true || v === 'true') return true
  if (v === false || v === 'false') return false
  return fallback
}

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [settings, setSettings] = useState<HomepageSettings>({})
  const { resolvedTheme, setTheme } = useTheme()
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  useEffect(() => {
    setMounted(true)
    const handler = () => setScrolled(window.scrollY > 30)
    window.addEventListener("scroll", handler)
    return () => window.removeEventListener("scroll", handler)
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/homepage', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : { settings: {} })
      .then(data => { if (!cancelled && data?.settings) setSettings(data.settings) })
      .catch(() => { /* keep defaults */ })
    return () => { cancelled = true }
  }, [])

  const isDark = mounted && resolvedTheme === "dark"
  const toggleTheme = () => setTheme(isDark ? "light" : "dark")

  const heroTitle       = settings.homepage_hero_title       || 'إتقانُ التِلاوة'
  const heroSubtitle    = settings.homepage_hero_subtitle    || 'ورحلةُ التَعَلُّم'
  const heroDescription = settings.homepage_hero_description ||
    'مِنبرٌ علميٌّ يجمع بين أكاديميَّةٍ راسخةٍ للدُّروسِ والشَّهادات، ومَقْرأةٍ روحانيَّةٍ للحفظِ والتَّسميعِ بإشرافِ المقرِئينَ المُجازين.'
  const ctaPrimaryText    = settings.homepage_cta_primary_text    || 'الأكاديميَّة'
  const ctaPrimaryLink    = settings.homepage_cta_primary_link    || '/academy/student'
  const ctaSecondaryText  = settings.homepage_cta_secondary_text  || 'المَقْرأة'
  const ctaSecondaryLink  = settings.homepage_cta_secondary_link  || '/student'
  const showStats         = asBool(settings.homepage_show_stats, true)
  const showFeatures      = asBool(settings.homepage_show_features, true)
  const showTestimonials  = asBool(settings.homepage_show_testimonials, true)
  const maintenanceOn     = asBool(settings.maintenance_mode, false)
  const maintenanceFull   = asBool(settings.maintenance_full_page, false)
  const maintenanceMsg    = settings.maintenance_message      || 'الموقع تحت الصيانة حاليًا، نعود قريبًا 🔧'
  const maintenanceColor  = settings.maintenance_banner_color || '#f59e0b'
  const primaryColor      = settings.homepage_primary_color   || 'var(--hp-navy)'
  const accentColor       = settings.homepage_accent_color    || 'var(--hp-bronze)'

  if (maintenanceOn && maintenanceFull) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center text-hp-ink dark:text-hp-cream bg-hp-parchment dark:bg-hp-dark"
        dir="rtl"
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6 text-3xl"
          style={{ backgroundColor: maintenanceColor + '22', color: maintenanceColor }}
        >
          🔧
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-4" style={{ color: primaryColor }}>
          {maintenanceMsg}
        </h1>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-hp-parchment text-hp-ink dark:bg-hp-dark dark:text-hp-cream overflow-x-hidden font-sans transition-colors duration-500" dir="rtl">
      {maintenanceOn && (
        <div
          className="sticky top-0 z-[60] w-full text-center text-sm py-3 px-4 font-medium shadow-md"
          style={{ backgroundColor: maintenanceColor, color: 'var(--hp-dark)' }}
        >
          {maintenanceMsg}
        </div>
      )}
      {/* ============ HEADER ============ */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.7 }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-hp-parchment/85 dark:bg-hp-dark/85 backdrop-blur-xl border-b border-hp-ink/10 dark:border-hp-cream/10 py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-11 h-11">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-hp-navy to-hp-green" />
              <svg viewBox="0 0 44 44" className="absolute inset-0 w-full h-full p-2.5 text-hp-gold" fill="currentColor" aria-hidden>
                <path d="M22 4 L26 18 L40 18 L29 27 L33 41 L22 32 L11 41 L15 27 L4 18 L18 18 Z" opacity="0.95" />
              </svg>
            </div>
            <div className="leading-tight">
              <div className="text-xl font-bold tracking-tight text-hp-navy dark:text-hp-gold" style={{ fontFamily: "var(--font-quran)" }}>
                إتْقان
              </div>
              <div className="text-[10px] tracking-[0.2em] text-hp-ink/55 dark:text-hp-cream/55 uppercase">
                Itqan Platform
              </div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-10">
            {[
              { href: "#sections", label: "المنصات" },
              { href: "#features", label: "المميزات" },
              { href: "#journey", label: "المسار" },
              { href: "#voices", label: "آراؤهم" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-hp-ink/70 dark:text-hp-cream/70 hover:text-hp-navy dark:hover:text-hp-gold transition-colors relative group"
              >
                {item.label}
                <span className="absolute -bottom-1.5 right-0 h-px w-0 bg-hp-bronze transition-all duration-500 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label="تبديل المظهر"
              className="relative w-10 h-10 rounded-full border border-hp-ink/15 dark:border-hp-cream/20 flex items-center justify-center text-hp-navy dark:text-hp-gold hover:border-hp-bronze dark:hover:border-hp-gold transition-all duration-500 hover:scale-105 overflow-hidden"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mounted && (
                  <motion.span
                    key={isDark ? "sun" : "moon"}
                    initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <Link
              href="/login"
              className="text-sm text-hp-ink/70 dark:text-hp-cream/70 hover:text-hp-navy dark:hover:text-hp-gold px-4 py-2 transition-colors"
            >
              دخول
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium px-5 py-2.5 rounded-full bg-hp-navy text-hp-parchment dark:bg-hp-gold dark:text-hp-dark hover:bg-hp-green dark:hover:bg-hp-gold-light transition-all duration-500 shadow-sm hover:shadow-lg"
            >
              التسجيل
            </Link>
          </div>

          <div className="lg:hidden flex items-center gap-1">
            <button
              onClick={toggleTheme}
              aria-label="تبديل المظهر"
              className="p-2 text-hp-navy dark:text-hp-gold"
            >
              {mounted && (isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />)}
            </button>
            <button
              className="p-2 text-hp-navy dark:text-hp-gold"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="القائمة"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-hp-parchment dark:bg-hp-dark border-t border-hp-ink/10 dark:border-hp-cream/10 overflow-hidden"
            >
              <div className="container mx-auto px-6 py-6 space-y-3">
                {[
                  { href: "#sections", label: "المنصات" },
                  { href: "#features", label: "المميزات" },
                  { href: "#journey", label: "المسار" },
                  { href: "#voices", label: "آراؤهم" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="block py-2 text-hp-ink/75 dark:text-hp-cream/75 hover:text-hp-navy dark:hover:text-hp-gold"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="pt-4 border-t border-hp-ink/10 dark:border-hp-cream/10 flex gap-3">
                  <Link href="/login" className="flex-1 py-3 text-center border border-hp-navy/20 dark:border-hp-gold/30 dark:text-hp-gold rounded-full">
                    دخول
                  </Link>
                  <Link href="/register" className="flex-1 py-3 text-center bg-hp-navy text-hp-parchment dark:bg-hp-gold dark:text-hp-dark rounded-full">
                    تسجيل
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ============ HERO ============ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {/* Ottoman carpet pattern — pure CSS, static opacity. SSR renders the
              same opacity the browser will keep, so refresh never flashes the
              pattern at full intensity. No framer-motion, no hydration delay. */}
          <div
            className="absolute inset-0 bg-repeat opacity-[0.18] dark:opacity-[0.26]"
            style={{
              backgroundImage: "url(/patterns/ottoman-carpet.jpg)",
              backgroundSize: "440px",
              filter: "grayscale(1) sepia(0.45) brightness(1.05) contrast(0.95)",
            }}
          />
          {/* Soft parchment / dark wash so text stays readable */}
          <div className="absolute inset-0 bg-gradient-to-b from-hp-parchment/85 via-hp-parchment/70 to-hp-parchment dark:from-hp-dark/85 dark:via-hp-dark/75 dark:to-hp-dark" />

          {/* Breathing warm radial glow behind the headline (in place, no drift) */}
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[60vw] h-[60vw] rounded-full blur-[140px] bg-hp-bronze/15 dark:bg-hp-gold/10"
          />

          {/* Large rotating eight-stars — pure in-place rotation around their own center */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
            className="absolute top-32 -right-20 text-hp-navy/10 dark:text-hp-gold/15"
          >
            <EightStar size={400} strokeWidth={0.4} />
          </motion.div>
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 110, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-20 -left-20 text-hp-green/10 dark:text-hp-gold/10"
          >
            <EightStar size={340} strokeWidth={0.4} />
          </motion.div>

          {/* Arabesque corners — pulse opacity ONLY, no Y drift */}
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-24 right-0"
          >
            <ArabesqueCorner size={180} className="text-hp-bronze/30 dark:text-hp-gold/30" />
          </motion.div>
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            className="absolute bottom-10 left-0"
          >
            <ArabesqueCorner size={180} className="text-hp-bronze/30 dark:text-hp-gold/30 rotate-180" />
          </motion.div>

          {/* Gold sparks — twinkle in place (scale + opacity), no drift */}
          {[
            { top: "18%", left: "12%", d: 12, delay: 0, dur: 5 },
            { top: "28%", left: "82%", d: 16, delay: 1.4, dur: 6 },
            { top: "62%", left: "8%", d: 9, delay: 2.8, dur: 4.5 },
            { top: "72%", left: "88%", d: 14, delay: 0.6, dur: 5.5 },
            { top: "44%", left: "20%", d: 8, delay: 3.2, dur: 4 },
            { top: "55%", left: "78%", d: 10, delay: 2, dur: 5 },
          ].map((m, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-hp-bronze/50 dark:bg-hp-gold/45 blur-[2px]"
              style={{ top: m.top, left: m.left, width: m.d, height: m.d }}
              animate={{
                scale: [0.6, 1.3, 0.6],
                opacity: [0.2, 0.85, 0.2],
              }}
              transition={{
                duration: m.dur,
                repeat: Infinity,
                ease: "easeInOut",
                delay: m.delay,
              }}
            />
          ))}

          {/* Eight-point sparkles — rotate around their own center + breathe */}
          {[
            { top: "22%", left: "30%", size: 22, delay: 0 },
            { top: "70%", left: "65%", size: 18, delay: 2.5 },
            { top: "38%", left: "75%", size: 14, delay: 1.2 },
          ].map((s, i) => (
            <motion.div
              key={`sparkle-${i}`}
              className="absolute text-hp-bronze/35 dark:text-hp-gold/40"
              style={{ top: s.top, left: s.left }}
              animate={{
                rotate: 360,
                scale: [0.85, 1.2, 0.85],
                opacity: [0.3, 0.9, 0.3],
              }}
              transition={{
                rotate: { duration: 20 + i * 4, repeat: Infinity, ease: "linear" },
                scale: { duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: s.delay },
                opacity: { duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: s.delay },
              }}
            >
              <EightStar size={s.size} strokeWidth={0.8} />
            </motion.div>
          ))}
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <Reveal delay={0} y={20}>
              <div className="inline-flex items-center gap-3 mb-10">
                <div className="h-px w-12 bg-hp-bronze" />
                <span className="text-xs tracking-[0.4em] text-hp-bronze uppercase font-medium">
                  بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيم
                </span>
                <div className="h-px w-12 bg-hp-bronze" />
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <h1
                className="text-[14vw] sm:text-[10vw] md:text-8xl lg:text-9xl font-bold leading-[0.95] tracking-tight dark:text-hp-cream mb-10 md:mb-14"
                style={{ fontFamily: "var(--font-quran)", color: primaryColor }}
              >
                {heroTitle}
              </h1>
            </Reveal>

            <Reveal delay={0.28}>
              <div className="flex items-center justify-center gap-5 mb-10 md:mb-12" aria-hidden>
                <div className="h-px w-14 md:w-20 bg-hp-bronze/50 dark:bg-hp-gold/40" />
                <span className="text-xs tracking-[0.5em] text-hp-bronze dark:text-hp-gold">٭</span>
                <div className="h-px w-14 md:w-20 bg-hp-bronze/50 dark:bg-hp-gold/40" />
              </div>
            </Reveal>

            <Reveal delay={0.38}>
              <h2
                className="text-[10vw] sm:text-[7vw] md:text-6xl lg:text-7xl font-light italic dark:text-hp-gold mb-12 md:mb-14"
                style={{ fontFamily: "var(--font-quran)", color: accentColor }}
              >
                {heroSubtitle}
              </h2>
            </Reveal>

            <Reveal delay={0.5}>
              <OrnamentDivider className="w-72 h-10 mx-auto mb-10 text-hp-bronze dark:text-hp-gold" />
            </Reveal>

            <Reveal delay={0.6}>
              <p className="text-base md:text-lg text-hp-ink/70 dark:text-hp-cream/70 leading-loose max-w-2xl mx-auto mb-14 px-4 whitespace-pre-line">
                {heroDescription}
              </p>
            </Reveal>

            <Reveal delay={0.75}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                <Link
                  href={ctaPrimaryLink}
                  className="group relative h-14 px-8 inline-flex items-center gap-3 bg-hp-navy text-hp-parchment dark:bg-hp-gold dark:text-hp-dark rounded-full overflow-hidden transition-all duration-500 hover:gap-5 shadow-lg shadow-hp-navy/20 dark:shadow-hp-gold/20 hover:shadow-2xl"
                >
                  <span className="absolute inset-0 bg-hp-green dark:bg-hp-gold-light translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  <GraduationCap className="w-5 h-5 relative z-10" />
                  <span className="relative z-10 font-medium">{ctaPrimaryText}</span>
                  <ArrowLeft className="w-4 h-4 relative z-10" />
                </Link>
                <Link
                  href={ctaSecondaryLink}
                  className="group relative h-14 px-8 inline-flex items-center gap-3 border border-hp-navy/25 dark:border-hp-gold/35 text-hp-navy dark:text-hp-gold rounded-full hover:gap-5 transition-all duration-500 hover:border-hp-green hover:bg-hp-green hover:text-hp-parchment dark:hover:border-hp-gold dark:hover:bg-hp-gold dark:hover:text-hp-dark"
                >
                  <BookOpen className="w-5 h-5" />
                  <span className="font-medium">{ctaSecondaryText}</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
            </Reveal>

            {showStats && <Reveal delay={0.9}>
              <div className="grid grid-cols-2 md:grid-cols-4 max-w-4xl mx-auto border-y border-hp-ink/10 dark:border-hp-cream/10 divide-x divide-hp-ink/10 dark:divide-hp-cream/10 divide-x-reverse">
                {[
                  { v: 12500, s: "+", l: "طالب وطالبة" },
                  { v: 320, s: "+", l: "معلِّم ومُقرئ" },
                  { v: 85, s: "%", l: "نسبة الإتقان" },
                  { v: 24, s: "/7", l: "متابعة دائمة" },
                ].map((s, i) => (
                  <div key={i} className="py-8 px-2 text-center">
                    <div className="text-3xl md:text-4xl font-bold text-hp-navy dark:text-hp-gold" style={{ fontFamily: "var(--font-quran)" }}>
                      <CountUp value={s.v} suffix={s.s} />
                    </div>
                    <div className="text-xs md:text-sm text-hp-ink/60 dark:text-hp-cream/60 mt-2 tracking-wide">{s.l}</div>
                  </div>
                ))}
              </div>
            </Reveal>}

            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="mt-16 text-hp-ink/40 dark:text-hp-cream/40 inline-flex flex-col items-center gap-2"
            >
              <span className="text-xs tracking-[0.3em]">تَصَفَّح</span>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ============ TWO PILLARS ============ */}
      <section id="sections" className="relative py-32 md:py-40 bg-hp-navy text-hp-parchment overflow-hidden">
        <TessellatedBg className="absolute inset-0 w-full h-full" color="var(--hp-gold)" opacity={0.04} />
        <div className="absolute inset-0 bg-gradient-to-b from-hp-navy via-hp-navy to-hp-navy-deep" />

        <div className="container mx-auto px-6 relative">
          <Reveal>
            <div className="text-center mb-20 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="h-px w-12 bg-hp-gold" />
                <span className="text-xs tracking-[0.35em] text-hp-gold uppercase">المنصَّتان</span>
                <div className="h-px w-12 bg-hp-gold" />
              </div>
              <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight" style={{ fontFamily: "var(--font-quran)" }}>
                طريقانِ نحوَ الإتقان
              </h2>
              <p className="text-hp-parchment/70 text-lg leading-relaxed">
                اخترْ مسارَك الذي يُلائمُ هِمَّتَكَ ووقتَك
              </p>
            </div>
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
            {/* ACADEMY */}
            <Reveal delay={0.1}>
              <Link href="/academy/student" className="group block relative">
                <ArchFrame className="absolute -inset-4 w-[calc(100%+2rem)] h-[calc(100%+2rem)] text-hp-gold/45 pointer-events-none" />
                <article className="relative h-full bg-gradient-to-br from-hp-parch-1 via-hp-parch-2 to-hp-parch-3 dark:from-hp-navd-1 dark:via-hp-navd-2 dark:to-hp-navd-3 rounded-t-[100px] rounded-b-2xl p-10 md:p-12 border border-hp-gold/50 dark:border-hp-gold/30 overflow-hidden transition-all duration-700 group-hover:border-hp-gold/80 dark:group-hover:border-hp-gold/60 group-hover:-translate-y-2 shadow-2xl shadow-black/40 dark:shadow-black/60">
                  <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-hp-bronze/15 dark:bg-hp-gold/10 rounded-full blur-3xl group-hover:bg-hp-bronze/25 dark:group-hover:bg-hp-gold/20 transition-all duration-700" />
                  <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-hp-bronze/10 dark:bg-hp-gold/8 rounded-full blur-3xl" />
                  <ArabesqueCorner size={120} className="absolute top-0 right-0 text-hp-bronze/35 dark:text-hp-gold/30" />
                  <ArabesqueCorner size={120} className="absolute bottom-0 left-0 text-hp-bronze/35 dark:text-hp-gold/30 rotate-180" />

                  <div className="relative">
                    <div className="text-7xl font-bold text-hp-bronze/35 dark:text-hp-gold/30 mb-2 leading-none" style={{ fontFamily: "var(--font-quran)" }}>
                      ٠١
                    </div>
                    <div className="flex items-center gap-3 mb-2 -mt-8">
                      <span className="text-xs tracking-[0.3em] text-hp-bronze dark:text-hp-gold uppercase">القسم الأول</span>
                    </div>
                    <h3 className="text-4xl md:text-5xl font-bold mb-4 text-hp-navy dark:text-hp-cream" style={{ fontFamily: "var(--font-quran)" }}>
                      الأكاديميَّة
                    </h3>
                    <p className="text-hp-ink/75 dark:text-hp-cream/75 leading-loose mb-10 text-base md:text-lg">
                      مَدْرسةٌ افتراضيَّةٌ منظَّمة، بدوراتٍ مُتدرِّجةٍ في علوم القرآن والتجويد والفقه،
                      تُتوَّجُ بشهاداتٍ وإجازاتٍ معتمدة.
                    </p>

                    <div className="space-y-4 mb-12">
                      {[
                        { i: ScrollText, t: "مناهجُ متدرِّجة", d: "من المبتدئ إلى الإجازة" },
                        { i: Award, t: "شهاداتٌ معتمدة", d: "موثَّقةٌ بختمِ الأكاديميَّة" },
                        { i: Users, t: "إشرافٌ مباشر", d: "أساتذةٌ مُجازون" },
                      ].map((f, i) => (
                        <div key={i} className="flex items-start gap-4 group/item">
                          <div className="w-10 h-10 rounded-full border border-hp-bronze/45 dark:border-hp-gold/40 bg-hp-bronze/10 dark:bg-hp-gold/10 flex items-center justify-center flex-shrink-0 group-hover/item:bg-hp-bronze/20 dark:group-hover/item:bg-hp-gold/20 group-hover/item:border-hp-bronze/70 dark:group-hover/item:border-hp-gold/65 transition-colors">
                            <f.i className="w-4 h-4 text-hp-bronze dark:text-hp-gold" />
                          </div>
                          <div>
                            <div className="font-semibold text-base mb-0.5 text-hp-navy dark:text-hp-cream" style={{ fontFamily: "var(--font-quran)" }}>{f.t}</div>
                            <div className="text-sm text-hp-ink/65 dark:text-hp-cream/60">{f.d}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-hp-bronze/30 dark:border-hp-gold/25">
                      <span className="text-hp-bronze dark:text-hp-gold font-medium">دخول الأكاديميَّة</span>
                      <div className="w-12 h-12 rounded-full bg-hp-navy dark:bg-hp-gold text-hp-gold dark:text-hp-dark flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-[-45deg]">
                        <ArrowLeft className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            </Reveal>

            {/* MAQRA'A */}
            <Reveal delay={0.25}>
              <Link href="/student" className="group block relative">
                <ArchFrame className="absolute -inset-4 w-[calc(100%+2rem)] h-[calc(100%+2rem)] text-hp-gold/45 pointer-events-none" />
                <article className="relative h-full bg-gradient-to-br from-hp-parchm-1 via-hp-parchm-2 to-hp-parchm-3 dark:from-hp-gold dark:via-hp-gold-light dark:to-hp-gold rounded-t-[100px] rounded-b-2xl p-10 md:p-12 border border-hp-gold/50 dark:border-hp-dark/30 overflow-hidden transition-all duration-700 group-hover:border-hp-gold/80 dark:group-hover:border-hp-dark/50 group-hover:-translate-y-2 shadow-2xl shadow-black/40 dark:shadow-black/60">
                  <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-hp-bronze/18 dark:bg-hp-dark/10 rounded-full blur-3xl group-hover:bg-hp-bronze/28 dark:group-hover:bg-hp-dark/15 transition-all duration-700" />
                  <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-hp-bronze/12 dark:bg-hp-dark/8 rounded-full blur-3xl" />
                  <ArabesqueCorner size={120} className="absolute top-0 right-0 text-hp-bronze/35 dark:text-hp-dark/25" />
                  <ArabesqueCorner size={120} className="absolute bottom-0 left-0 text-hp-bronze/35 dark:text-hp-dark/25 rotate-180" />

                  <div className="relative">
                    <div className="text-7xl font-bold text-hp-bronze/35 dark:text-hp-dark/30 mb-2 leading-none" style={{ fontFamily: "var(--font-quran)" }}>
                      ٠٢
                    </div>
                    <div className="flex items-center gap-3 mb-2 -mt-8">
                      <span className="text-xs tracking-[0.3em] text-hp-bronze dark:text-hp-dark/80 uppercase">القسم الثاني</span>
                    </div>
                    <h3 className="text-4xl md:text-5xl font-bold mb-4 text-hp-green dark:text-hp-dark" style={{ fontFamily: "var(--font-quran)" }}>
                      المَقْرأة
                    </h3>
                    <p className="text-hp-ink/75 dark:text-hp-dark/85 leading-loose mb-10 text-base md:text-lg">
                      مجلسٌ روحانيٌّ مُباشَر، تَعْرضُ تِلاوتَكَ على المُقرئِ المُجاز،
                      فيُصحِّحُ ويُتابعُ ويُجيز.
                    </p>

                    <div className="space-y-4 mb-12">
                      {[
                        { i: Mic, t: "تَسميعٌ مُباشر", d: "بصوتِكَ وبتفاعلٍ حيّ" },
                        { i: Calendar, t: "حَجزٌ مَرِن", d: "مواعيدُ تُناسبُك" },
                        { i: BookOpen, t: "مُتابعةُ الحفظ", d: "تقدُّمٌ مُسجَّلٌ كلَّ جلسة" },
                      ].map((f, i) => (
                        <div key={i} className="flex items-start gap-4 group/item">
                          <div className="w-10 h-10 rounded-full border border-hp-bronze/45 dark:border-hp-dark/40 bg-hp-bronze/10 dark:bg-hp-dark/10 flex items-center justify-center flex-shrink-0 group-hover/item:bg-hp-bronze/20 dark:group-hover/item:bg-hp-dark/20 group-hover/item:border-hp-bronze/70 dark:group-hover/item:border-hp-dark/60 transition-colors">
                            <f.i className="w-4 h-4 text-hp-bronze dark:text-hp-dark" />
                          </div>
                          <div>
                            <div className="font-semibold text-base mb-0.5 text-hp-green dark:text-hp-dark" style={{ fontFamily: "var(--font-quran)" }}>{f.t}</div>
                            <div className="text-sm text-hp-ink/65 dark:text-hp-dark/75">{f.d}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-hp-bronze/30 dark:border-hp-dark/25">
                      <span className="text-hp-bronze dark:text-hp-dark font-medium">دخول المَقْرأة</span>
                      <div className="w-12 h-12 rounded-full bg-hp-green dark:bg-hp-dark text-hp-gold dark:text-hp-gold flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-[-45deg]">
                        <ArrowLeft className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      {showFeatures && <section id="features" className="relative py-32 md:py-40 bg-hp-parchment dark:bg-hp-dark overflow-hidden transition-colors duration-500">
        <div className="absolute inset-0 pointer-events-none">
          <EightStar size={500} className="absolute -top-40 -left-40 text-hp-navy/5 dark:text-hp-gold/8" strokeWidth={0.3} />
          <EightStar size={400} className="absolute -bottom-32 -right-32 text-hp-green/5 dark:text-hp-gold/6" strokeWidth={0.3} />
        </div>

        <div className="container mx-auto px-6 relative">
          <Reveal>
            <div className="grid lg:grid-cols-12 gap-10 mb-20">
              <div className="lg:col-span-5">
                <span className="text-xs tracking-[0.35em] text-hp-bronze dark:text-hp-gold uppercase mb-4 block">المميزات</span>
                <h2 className="text-5xl md:text-6xl font-bold leading-tight text-hp-navy dark:text-hp-cream" style={{ fontFamily: "var(--font-quran)" }}>
                  تجربةٌ مُتكاملة بِتفاصيلَ مَدروسة
                </h2>
              </div>
              <div className="lg:col-span-6 lg:col-start-7 flex items-end">
                <p className="text-lg text-hp-ink/65 dark:text-hp-cream/65 leading-loose">
                  كلُّ ميزةٍ صُمِّمَت لِتُلامسَ احتياجَ الطالب، فلا تَكلُّفَ ولا تَعقيد،
                  بل أدواتٌ صريحةٌ تُعينُك على الإتقان.
                </p>
              </div>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { num: "٠١", t: "حَلَقاتٌ مرئيَّة", d: "جلساتٌ مباشرةٌ بصوتٍ وصورةٍ، تَحاكي الحَلْقةَ التقليديَّة في رحابِ المساجد.", i: Users },
              { num: "٠٢", t: "تَسجيلُ التِّلاوة", d: "سجِّل تِلاوتَكَ في أيِّ وقت، وأرسلْها للمُقرئ ليُصحِّحَ ويُعلِّقَ على كلِّ آية.", i: Mic },
              { num: "٠٣", t: "مُتابعةُ التَّقدُّم", d: "إحصاءاتٌ دقيقةٌ تُظهِرُ مُعدَّلَ حِفظِك وإتقانِك أسبوعيًّا وشهريًّا.", i: Star },
              { num: "٠٤", t: "شهاداتٌ مُوثَّقة", d: "عند إتمامِ مسارٍ تعليميٍّ، تَحصُلُ على شهادةٍ مَعزُوَّةٍ بختمِ الأكاديميَّة.", i: Award },
              { num: "٠٥", t: "حَجْزٌ مَرِن", d: "اختر مُقرِئَكَ والوقتَ المُناسبَ لك من تقويمٍ ذكيٍّ يَعرضُ المتاحَ فقط.", i: Calendar },
              { num: "٠٦", t: "مَكتبةٌ معرفيَّة", d: "محاضراتٌ ومَقالاتٌ في علوم القرآن والفقه والتفسير، يتجدَّدُ مُحتواها أُسبوعيًّا.", i: ScrollText },
            ].map((f, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <article className="group relative h-full p-10 bg-hp-card dark:bg-hp-dark-2 border border-hp-navy/10 dark:border-hp-gold/15 rounded-2xl overflow-hidden hover:border-hp-bronze/40 dark:hover:border-hp-gold/45 transition-all duration-500">
                  <div className="absolute top-0 left-0 w-20 h-20">
                    <ArabesqueCorner size={80} color="var(--hp-bronze)" className="opacity-20 dark:opacity-30 group-hover:opacity-40 dark:group-hover:opacity-50 transition-opacity" />
                  </div>

                  <div className="relative">
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-3xl font-bold text-hp-bronze/60 dark:text-hp-gold/55" style={{ fontFamily: "var(--font-quran)" }}>
                        {f.num}
                      </span>
                      <div className="w-12 h-12 rounded-full bg-hp-navy/5 dark:bg-hp-gold/10 flex items-center justify-center transition-all duration-500 group-hover:bg-hp-navy dark:group-hover:bg-hp-gold group-hover:rotate-12">
                        <f.i className="w-5 h-5 text-hp-navy dark:text-hp-gold group-hover:text-hp-gold dark:group-hover:text-hp-navy transition-colors" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-hp-navy dark:text-hp-cream mb-3" style={{ fontFamily: "var(--font-quran)" }}>
                      {f.t}
                    </h3>
                    <p className="text-hp-ink/65 dark:text-hp-cream/65 leading-loose text-sm">{f.d}</p>
                  </div>

                  <div className="absolute bottom-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-hp-bronze/30 dark:via-hp-gold/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>}

      {/* ============ JOURNEY ============ */}
      <section id="journey" className="relative py-32 md:py-40 bg-hp-card dark:bg-hp-dark-3 border-y border-hp-navy/10 dark:border-hp-gold/15 overflow-hidden transition-colors duration-500">
        <div className="container mx-auto px-6">
          <Reveal>
            <div className="text-center mb-20 max-w-2xl mx-auto">
              <span className="text-xs tracking-[0.35em] text-hp-bronze dark:text-hp-gold uppercase mb-4 block">المسار</span>
              <OrnamentDivider className="w-48 h-8 mx-auto mb-6 text-hp-bronze dark:text-hp-gold" />
              <h2 className="text-5xl md:text-6xl font-bold text-hp-navy dark:text-hp-cream leading-tight mb-6" style={{ fontFamily: "var(--font-quran)" }}>
                كيف تَبدأُ رحلتَك
              </h2>
              <p className="text-lg text-hp-ink/65 dark:text-hp-cream/65">
                أربعُ خطواتٍ هَيِّنات، وأنتَ في صَدرِ المَجلس
              </p>
            </div>
          </Reveal>

          <div className="max-w-4xl mx-auto">
            {[
              { n: "١", t: "سَجِّل في المنصَّة", d: "أنشئ حسابَكَ في دقائق، اختر منصَّتَك (الأكاديميَّة أو المَقْرأة أو كلتيهما)، وأَكمِل ملفَّكَ التعريفيَّ." },
              { n: "٢", t: "اخْتَر مُعلِّمَك", d: "تصفَّح قائمةَ الأساتذةِ والمُقرئين، اقرأْ سيرَهم وتقييماتِ طلَّابِهم، ثم اخترِ الأنسبَ لك." },
              { n: "٣", t: "احْجِزْ موعدَك", d: "اختر اليومَ والساعةَ من تقويمِ المُعلِّم، فيَصلُكَ تَنبيهٌ قبلَ الجلسةِ بوقتٍ كافٍ." },
              { n: "٤", t: "ابْدأْ في الإتقان", d: "احْضُرْ الجلساتِ، أَنجِزْ الواجبات، وَتابعْ تقدُّمَك حتى تَبلُغَ غايتَك بإذن الله." },
            ].map((step, i) => (
              <Reveal key={i} delay={i * 0.12}>
                <div className="group relative flex gap-8 md:gap-12 py-10 border-b border-hp-navy/10 dark:border-hp-gold/15 last:border-0">
                  <div className="flex-shrink-0">
                    <div
                      className="text-7xl md:text-8xl font-bold text-hp-bronze/30 dark:text-hp-gold/35 leading-none transition-all duration-500 group-hover:text-hp-bronze dark:group-hover:text-hp-gold"
                      style={{ fontFamily: "var(--font-quran)" }}
                    >
                      {step.n}
                    </div>
                  </div>
                  <div className="flex-1 pt-2">
                    <h3 className="text-2xl md:text-3xl font-bold text-hp-navy dark:text-hp-cream mb-4" style={{ fontFamily: "var(--font-quran)" }}>
                      {step.t}
                    </h3>
                    <p className="text-hp-ink/65 dark:text-hp-cream/65 leading-loose md:text-lg max-w-2xl">{step.d}</p>
                  </div>
                  <div className="hidden md:flex items-center text-hp-bronze/40 dark:text-hp-gold/45 group-hover:text-hp-bronze dark:group-hover:text-hp-gold group-hover:-translate-x-2 transition-all duration-500">
                    <ArrowLeft className="w-6 h-6" />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      {showTestimonials && <TestimonialsMarquee />}

      {/* ============ CTA ============ */}
      <section className="relative py-32 md:py-40 bg-hp-navy text-hp-parchment overflow-hidden">
        {/* Ottoman carpet pattern — desaturated, gold-toned woven texture */}
        <div
          className="absolute inset-0 bg-repeat opacity-[0.22] pointer-events-none"
          style={{
            backgroundImage: "url(/patterns/ottoman-carpet.jpg)",
            backgroundSize: "440px",
            filter: "grayscale(1) sepia(0.55) brightness(0.95) contrast(1)",
          }}
        />
        {/* Navy wash to keep text readable on top of the pattern */}
        <div className="absolute inset-0 bg-gradient-to-b from-hp-navy/85 via-hp-navy/75 to-hp-navy/90 pointer-events-none" />
        {/* Gold seams */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-hp-gold/40 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-hp-gold/30 to-transparent" />

        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -right-40 text-hp-gold/10"
        >
          <EightStar size={500} strokeWidth={0.4} />
        </motion.div>
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -left-40 text-hp-gold/10"
        >
          <EightStar size={500} strokeWidth={0.4} />
        </motion.div>

        <div className="container mx-auto px-6 relative">
          <Reveal>
            <div className="max-w-3xl mx-auto text-center">
              <Sparkles className="w-10 h-10 text-hp-gold mx-auto mb-6" />
              <OrnamentDivider className="w-48 h-8 mx-auto mb-8 text-hp-gold" />
              <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-tight" style={{ fontFamily: "var(--font-quran)" }}>
                ابْدَأْ رحلتَك اليومَ
              </h2>
              <p className="text-lg md:text-xl text-hp-parchment/70 leading-loose mb-12">
                انضمَّ إلى آلاف الطلَّابِ الذينَ بَدَؤوا رحلتَهم نحو إتقانِ كتابِ الله،
                ولا تَنْسَ أنَّ <span className="text-hp-gold" style={{ fontFamily: "var(--font-quran)" }}>«خيرُكم مَن تَعَلَّمَ القرآنَ وعَلَّمَه»</span>.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="group h-14 px-10 inline-flex items-center gap-3 bg-hp-gold text-hp-navy rounded-full font-bold transition-all duration-500 hover:gap-5 shadow-2xl shadow-hp-gold/20"
                >
                  <span>سَجِّل مَجَّانًا</span>
                  <ArrowLeft className="w-5 h-5 transition-transform duration-500 group-hover:-translate-x-1" />
                </Link>
                <Link
                  href="/login"
                  className="h-14 px-10 inline-flex items-center gap-3 border border-hp-parchment/25 rounded-full hover:bg-hp-parchment/5 transition-colors"
                >
                  لديَّ حسابٌ بالفعل
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="relative bg-hp-navy-deep text-hp-parchment/85 pt-20 pb-10 overflow-hidden">
        {/* Ottoman carpet — woven texture beneath the dark wash */}
        <div
          className="absolute inset-0 bg-repeat opacity-[0.18] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: "url(/patterns/ottoman-carpet.jpg)",
            backgroundSize: "440px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-hp-navy-deep via-hp-navy-deep/92 to-hp-navy-deep pointer-events-none" />
        {/* Top thin gold seam */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-hp-gold/40 to-transparent" />

        <div className="container mx-auto px-6 relative">
          <div className="grid lg:grid-cols-12 gap-10 pb-12 border-b border-hp-parchment/10">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-hp-navy-2 to-hp-green" />
                  <svg viewBox="0 0 44 44" className="absolute inset-0 w-full h-full p-2.5 text-hp-gold" fill="currentColor" aria-hidden>
                    <path d="M22 4 L26 18 L40 18 L29 27 L33 41 L22 32 L11 41 L15 27 L4 18 L18 18 Z" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-hp-parchment" style={{ fontFamily: "var(--font-quran)" }}>
                    إتْقان
                  </div>
                  <div className="text-[10px] tracking-[0.2em] text-hp-parchment/50 uppercase">
                    Itqan Platform
                  </div>
                </div>
              </div>
              <p className="text-hp-parchment/60 leading-loose max-w-md mb-6">
                مِنبرٌ علميٌّ يجمع بين الأكاديميَّة الراسخة والمَقْرأة الروحانيَّة،
                لِيَكونَ صَرحًا متكاملًا لإتقانِ كتابِ الله.
              </p>
              <OrnamentDivider className="w-40 h-6 text-hp-gold/50" />
            </div>

            <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-sm font-bold text-hp-gold mb-5 tracking-wider">الأكاديميَّة</h4>
                <ul className="space-y-3 text-sm">
                  <li><Link href="/academy/student" className="hover:text-hp-gold transition-colors">لوحة التحكُّم</Link></li>
                  <li><Link href="/academy/student/courses" className="hover:text-hp-gold transition-colors">الدَّورات</Link></li>
                  <li><Link href="/academy/student/path" className="hover:text-hp-gold transition-colors">المَسار</Link></li>
                  <li><Link href="/academy/student/certificates" className="hover:text-hp-gold transition-colors">الشَّهادات</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-bold text-hp-gold mb-5 tracking-wider">المَقْرأة</h4>
                <ul className="space-y-3 text-sm">
                  <li><Link href="/student" className="hover:text-hp-gold transition-colors">لوحة التحكُّم</Link></li>
                  <li><Link href="/student/recitations" className="hover:text-hp-gold transition-colors">التَّسميعات</Link></li>
                  <li><Link href="/student/booking" className="hover:text-hp-gold transition-colors">حَجْزُ موعد</Link></li>
                  <li><Link href="/student/progress" className="hover:text-hp-gold transition-colors">التَّقدُّم</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-bold text-hp-gold mb-5 tracking-wider">الدَّعم</h4>
                <ul className="space-y-3 text-sm">
                  <li><Link href="/about" className="hover:text-hp-gold transition-colors">عَن المنصَّة</Link></li>
                  <li><Link href="/contact" className="hover:text-hp-gold transition-colors">تَواصلْ معنا</Link></li>
                  <li><Link href="/privacy" className="hover:text-hp-gold transition-colors">الخصوصيَّة</Link></li>
                  <li><Link href="/terms" className="hover:text-hp-gold transition-colors">الشُّروط</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-hp-parchment/55">
            <div>© {new Date().getFullYear()} إتْقان. جميعُ الحقوقِ محفوظة.</div>
            <div className="flex items-center gap-2">
              <span>صُنِعَ بِـ</span>
              <span className="text-hp-gold">♥</span>
              <span>لِخدمةِ كتابِ الله</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
