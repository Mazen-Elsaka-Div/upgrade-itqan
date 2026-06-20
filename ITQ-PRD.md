# PRD — منصة إتقان (أكاديمية العلوم الإسلامية)

منصة تعليمية إسلامية متكاملة مبنية بـ **Next.js 16 + Supabase + PostgreSQL** تجمع بين الدروس المباشرة والدورات التفاعلية مع نظام متقدم للحفظ والمراجعة. المنصة تدعم وضعين: **المكتبة الرقمية (Reader)** و **الأكاديمية (Academy)** مع إمكانية التبديل بينهما.

**آخر تحديث:** 21 يونيو 2026

---

## 1. نظرة عامة على المشروع

### 1.1 الرؤية
منصة تعليمية شاملة لأكاديمية العلوم الإسلامية توفر بيئة تعليمية متكاملة تشمل الدورات التعليمية، الحفظ والمراجعة، المسابقات، الفقه، المنتدى، والجلسات الحية مع نظام متقدم للنقاط والشارات والمستويات.

### 1.2 التقنيات المستخدمة
| الفئة | التقنية |
|-------|---------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript |
| **UI** | Tailwind CSS 4, Radix UI, shadcn/ui, Framer Motion |
| **Backend** | Next.js API Routes, PostgreSQL (Supabase) |
| **Authentication** | JWT (jose) + better-auth |
| **Video** | LiveKit (محلي) + Zoom/Google Meet (خارجي) |
| **Storage** | S3 (AWS), Cloudinary |
| **Email** | Nodemailer (SMTP) |
| **State** | SWR, React Hook Form + Zod |
| **Charts** | Recharts |
| **Testing** | Vitest, Testing Library, MSW |
| **PDF** | Puppeteer, pdf-lib, satori |

### 1.3 البنية التقنية (High-Level)
```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ Academy  │ │ Reader   │ │ Community│ │ Public │ │
│  │ (Student │ │ (Reciter │ │ (Forum)  │ │ Pages  │ │
│  │ Teacher  │ │  Admin)  │ │          │ │        │ │
│  │ Admin    │ │          │ │          │ │        │ │
│  │ Parent   │ │          │ │          │ │        │ │
│  │ Super.)  │ │          │ │          │ │        │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
├─────────────────────────────────────────────────────┤
│                  API Layer (Next.js)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ Academy  │ │ Reader   │ │ Cron     │ │ Auth   │ │
│  │ APIs     │ │ APIs     │ │ Jobs     │ │ APIs   │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
├─────────────────────────────────────────────────────┤
│              Database (PostgreSQL/Supabase)          │
│  ┌──────────────────────────────────────────────┐   │
│  │ users │ courses │ lessons │ tasks │ sessions │   │
│  │ enrollments │ points_log │ badges │ forum    │   │
│  │ fiqh │ competitions │ halaqat │ certificates│   │
│  └──────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│              External Services                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ LiveKit  │ │ S3/Cloud │ │ SMTP     │ │ Zoom   │ │
│  │ (Video)  │ │ (Storage)│ │ (Email)  │ │ Meet   │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 2. الأدوار (User Roles)

### 2.1 الأدوار الأساسية
| الدور | المعرّف | الوصول |
|-------|---------|--------|
| **طالب الأكاديمية** | `academy_student` | `/academy/student` |
| **أستاذ** | `teacher` | `/academy/teacher` |
| **أدمن الأكاديمية** | `academy_admin` | `/academy/admin` |
| **ولي الأمر** | `parent` | `/academy/parent` |
| **مشرف المحتوى** | `content_supervisor` | `/academy/content-supervisor` |
| **مشرف الفقه** | `fiqh_supervisor` | `/academy/fiqh-supervisor` |
| **مراقب الجودة** | `quality_supervisor` | `/academy/supervisor/quality` |
| **مسؤول الفقه** | `supervisor` (fiqh) | `/academy/officer/fiqh` |
| **طالب (Reader)** | `reader` | `/reader` |
| **أدمن عام** | `admin` | `/admin` |
| **مشرف طلاب** | `student_supervisor` | `/academy/supervisor` |
| **مشرف قراء** | `reciter_supervisor` | Reader admin |

### 2.2 نظام الأدوار المتعددة
- المستخدم يمكن أن يكون له **عدة أدوار** في نفس الوقت
- `academy_roles` field في JWT يحتوي على جميع أدوار الأكاديمية
- `platform_preference`: تحدد المنصة المفضلة (academy / reader)
- `has_academy_access`: boolean للتحكم في دخول الأكاديمية
- `has_quran_access`: boolean للتحكم في دخول المكتبة

### 2.3 Mode Switcher
- يظهر للحسابات المزدوجة (academy + reader) والأدمن
- يخفي للحسابات الأكاديمية فقط
- يبدل بين `/academy/student` والمنصات الأخرى
- Animation: fade + slide باستخدام Framer Motion
- لون الأكاديمية: أزرق `#1E3A5F`

---

## 3. البنية التحتية (Foundation)

### 3.1 قاعدة البيانات
- **نوع:** PostgreSQL عبر Supabase
- **الاتصال:** Connection pooling (max 10, min 2)
- **SSL:** `sslmode=no-verify` للتوافق مع Supabase
- **الملفات:** `lib/db.ts` (pool), `lib/db-queries/` (استعلامات مخصصة)

### 3.2 نظام المصادقة
- **التوكن:** JWT مع jose (HS256, صالحة 30 يوم)
- **الكوكيز:** `auth-token` HttpOnly cookie
- **التحقق:** `verifyToken()` → `getSession()` → `requireRole()`
- **المصادقة المزدوجة:** مدعومة (better-auth config)

### 3.3 حماية المسارات (RBAC Middleware)
```typescript
// lib/rbac-middleware.ts
verifyAndGetUser(req)     → استخراج المستخدم من التوكن
checkPermission(role, resource, action) → التحقق من الصلاحية
```

**القواعد:**
- المستخدم غير المسجل → `/login`
- بدون `has_academy_access` → منع دخول `/academy/student`
- ولي الأمر لا يصل لبيانات طالب غير مربوط به
- الأستاذ لا يدخل `/academy/admin` ولا `/student`

### 3.4 التسجيل `/register`
- خيارات: «الأكاديمية فقط» / «الأكاديمية + مقرأة»
- الخيار الافتراضي: «الأكاديمية + مقرأة»
- حفظ: `has_academy_access`, `platform_preference`
- حقول إلزامية قابلة للتعديل من الأدمن (تاريخ ميلاد، جنس، دولة، مستوى تعليمي)

---

## 4. صفحات وميزات طالب الأكاديمية

### 4.1 لوحة التحكم `/academy/student`
**المكونات:**
- إحصائيات: الدورات، النقاط، المستوى، الـ Streak
- الجلسات القادمة
- الدورات النشطة مع نسبة التقدم
- Adhkar Widget
- Prayer Times Dialog
- Quick Actions

**API:** `GET /api/academy/student/stats`

### 4.2 الدورات

#### تصفح الدورات `/academy/student/courses/browse`
- عرض الدورات مصنفة حسب التصنيف
- فلترة بالتصنيف و المستوى (مبتدئ/متوسط/متقدم)
- بحث بالاسم

#### تفاصيل الدورة `/academy/student/courses/[id]`
- وصف الدورة + قائمة الدروس
- زر «طلب انضمام» أو «متابعة» حسب حالة التسجيل
- معلومات الأستاذ

#### دوراتي `/academy/student/courses`
- الدورات المسجل بها
- نسبة الإكمال لكل دورة
- 마지막 درس مكتملة

#### درس `/academy/student/courses/[id]/lessons/[lessonId]`
- فيديو/صوت + مواد + وصف + مرفقات PDF
- تحديث نسبة التقدم تلقائياً
- تقييم الدرس

**API:**
- `GET /api/academy/student/courses` — دوراتي
- `GET /api/academy/student/enrollments` — طلبات الالتحاق
- `GET /api/academy/student/lessons/[id]` — تفاصيل الدرس

### 4.3 المهام `/academy/student/tasks`
- قائمة المهام مع deadlines
- تفاصيل المهمة (الوصف وتاريخ التسليم)
- رفع ملف أو تسجيل صوتي للتسليم
- حالة: pending / submitted / graded / late

**API:** `GET/POST /api/academy/student/tasks`

### 4.4 الحفظ `/academy/student/memorization`
- سجل الحفظ والتقدم
- عرض إجمالي من 6236 آية + من 30 جزء
- **خريطة المصحف البصرية:** 604 صفحة بثلاثة ألوان:
  - أخضر = محفوظ
  - أصفر = مراجع
  - رمادي = غير محفوظ
- تتحدث تلقائياً بعد قبول التسميع
- تأكيد إتمام أهداف الحفظ الأسبوعية

**API:** `GET/POST /api/academy/student/memorization`

### 4.5 الجلسات `/academy/student/sessions`
- الجلسات الحية والتسجيلات
- تفاصيل الجلسة + رابط الدخول
- تذكيرات قبل الجلسة

**API:** `GET /api/academy/student/sessions`

### 4.6 المسار التعليمي `/academy/student/path`
- المسار التعليمي + التقدم
- مراحل مقفولة تظهر `locked`
- المسارات: حفظ القرآن، التجويد، الفقه، العقيدة، السيرة، التفسير

### 4.7 الإحصائيات `/academy/student/progress`
- رسوم بيانية أسبوعية وشهرية للحفظ والمراجعة
- معدل النشاط
- أكثر الدورات اشتراكاً

### 4.8 لوحة المتصدرين `/academy/student/leaderboard`
- ترتيب حسب النقاط
- فلتر: على مستوى الحلقة / المنصة كاملة
- تحديث ترتيب لحظي + Animation
- خريطة المصحف الملونة

**API:** `GET /api/academy/leaderboard`

### 4.9 الشارات `/academy/student/badges`
- الشارات المكتسبة + المتبقية
- شروط الحصول + نسب التقدم
- تتبع التقدم (مثلاً 67/100)

**API:** `GET /api/academy/student/badges`

### 4.10 التقويم `/academy/student/calendar`
- مواعيد الجلسات والدروس والمهام والـ deadlines
- list view على الموبايل
- زر «انضمام للجلسة» إذا اليوم
- فلترة حسب النوع

**API:** `GET /api/academy/student/calendar`

### 4.11 طلبات الانضمام `/academy/student/enrollment-requests`
- حالة طلبات الانضمام للدورات
- قبول / رفض مع سبب

### 4.12 الشهادات `/academy/student/certificates`
- الشهادات المكتسبة
- تحميل PDF
- ملء بيانات الإصدار

**API:** `GET /api/academy/student/certificates`

### 4.13 المحادثات `/academy/student/chat`
- المحادثات مع الأساتذة
- بحث بالاسم
- آخر رسالة + unread indicator

**API:** `GET/POST /api/conversations`

### 4.14 الفقه `/academy/student/fiqh`
- إرسال الأسئلة الفقهية
- عرض الأسئلة المُجابة
- تفاصيل سؤال + الإجابة
- حقول مخصصة للسؤال (مدعومة من `lib/fiqh-helpers.ts`)

**API:** `GET/POST /api/academy/fiqh`

### 4.15 المنتدى `/academy/student/forum`
- الفئات والموضوعات
- إنشاء موضوع جديد
- ردود مع دعم الصور

**API:** `GET/POST /api/academy/forum`

### 4.16 الإشعارات `/academy/student/notifications`
- إشعارات (قبول/رفض دورات، مهام جديدة، إلخ)
- فلتر «غير مقروءة»
- Bell icon مع pulse animation

**API:** `GET /api/notifications`

### 4.17 الملف الشخصي `/academy/student/profile`
- تعديل البيانات
- المنصة المفضلة
- رفع الصورة

### 4.18 طلبات ولي الأمر `/academy/student/parent-requests`
- طلبات ربط ولي الأمر
- قبول / رفض

**API:** `GET/POST /api/academy/student/parent-requests`

### 4.19 المسابقات `/academy/student/competitions`
- المسابقات المفتوحة + التواريخ
- تفاصيل مسابقة + تسجيل تلاوة للمسابقة
- النتائج

**API:** `GET/POST /api/academy/competitions`

### 4.20 النقاط `/academy/student/points`
- النقاط + سجل كامل للنقاط المكتسبة وأسبابها
- تفاصيل كل نقطة

**API:** `GET /api/academy/student/points`

### 4.21 الحلقات `/academy/student/halaqat`
- الحلقات المسجل بها
- تفاصيل الحلقة

### 4.22 الدعوات `/academy/invite/[code]`
- الانضمام لدورة عبر كود دعوة

### 4.23 السلاسل `/academy/student/series`
- عرض السلاسل التعليمية

---

## 5. صفحات وميزات أستاذ الأكاديمية

### 5.1 لوحة التحكم `/academy/teacher`
**المكونات:**
- إحصائيات: الدورات، الطلاب، المهام المنتظرة، الجلسات
- مهام تحتاج تقييم
- جلسات قادمة
- Quick Actions

### 5.2 الدورات `/academy/teacher/courses`
- قائمة الدورات الخاصة بالأستاذ
- إنشاء دورة جديدة (الاسم + التصنيف + المستوى)
- تعديل بيانات الدورة
- إدارة الدروس مع Drag & Drop للترتيب
- رفع فيديو/PDF

**API:** `GET/POST/PATCH /api/academy/teacher/courses`

### 5.3 المهام `/academy/teacher/tasks`
- قائمة المهام وتسليمات الطلاب
- إنشاء مهمة جديدة (لطالب فردي أو لمجموعة)
- تفاصيل المهمة + حالة كل طالب
- إضافة درجة وملاحظة للتسليم
- حذف المهام

**API:** `GET/POST/PATCH/DELETE /api/academy/teacher/tasks`

### 5.4 الجدول `/academy/teacher/calendar`
- إدارة المواعيد
- جدولة جلسة

### 5.5 الطلاب `/academy/teacher/students`
- الطلاب + نسبة التقدم
- إنشاء حساب طالب يدوياً

**API:** `GET/POST /api/academy/teacher/students`

### 5.6 الجلسات `/academy/teacher/sessions`
- الجلسات وروابطها
- تعديل / حذف
- بدء جلسة فيديو مباشرة (تكامل مع Zoom/Google Meet)
- تسجيلات الجلسات السابقة

**API:** `GET/POST/PATCH/DELETE /api/academy/teacher/sessions`

### 5.7 البث المباشر `/academy/teacher/live`
- بدء جلسة فيديو مباشرة
- رابط LiveKit أو Zoom/Meet
- إرسال لطالب واحد أو مجموعة

**API:** `POST/PATCH /api/academy/teacher/live-session`

### 5.8 الحلقات `/academy/teacher/halaqat`
- الحلقات التي يديرها
- إدارة الطلاب وتتبع الحضور

**API:** `GET /api/academy/teacher/halaqat`

### 5.9 طلبات الالتحاق `/academy/teacher/enrollment-requests`
- طلبات الانضمام + قبول / رفض

### 5.10 الدعوات `/academy/teacher/invitations`
- إنشاء كود دعوة (مثل `ITQ-FIQH-2026-A1`)
- تتبع الدعوات

**API:** `GET/POST /api/academy/teacher/invitations`

### 5.11 المحادثات `/academy/teacher/chat`
- المحادثات مع الطلاب
- مرتبة بآخر رسالة + بحث بالاسم

### 5.12 الإشعارات `/academy/teacher/notifications`
- إشعارات متنوعة

### 5.13 الملف الشخصي `/academy/teacher/profile`
- الملف + حقول التخصص والمؤهلات

### 5.14 المنتدى `/academy/teacher/forum`
- نشر مقالات

### 5.15 الحفظ `/academy/teacher/memorization`
- متابعة تقدم حفظ جميع الطلاب

**API:** `GET /api/academy/teacher/memorization`

### 5.16 أهداف الحفظ `/academy/teacher/memorization-goals` (مدمج في `paths`)
- تحديد أهداف حفظ أسبوعية لكل طالب (آيات/صفحات)
- متابعة الإنجاز

**API:** `GET/POST /api/academy/teacher/memorization`

### 5.17 رسائل أولياء الأمور `/academy/teacher/parent-messages`
- رسائل من أولياء الأمور

### 5.18 الدورات العامة `/academy/teacher/public-lessons`
- إدارة الدورات العامة المفتوحة

**API:** `GET/POST /api/academy/teacher/public-lessons`

### 5.19 الشهادات `/academy/teacher/certificates`
- إدارة شهادات الطلاب

### 5.20 المسارات `/academy/teacher/paths`
- متابعة المسارات التعليمية

**سير العمل:** الدرس المرفوق يذهب إلى «انتظار مراجعة المشرف» قبل النشر.

---

## 6. صفحات وميزات أدمن الأكاديمية

### 6.1 لوحة التحكم `/academy/admin`
**المكونات:**
- إحصائيات: الطلاب، الأساتذة، الدورات، الالتحاقات
- رسوم بيانية تفاعلية
- Quick Actions
- آخر النشاطات

**API:** `GET /api/academy/admin/stats`

### 6.2 إدارة الدورات `/academy/admin/courses`
- إدارة كل الدورات + تعيين مدرس مخصص
- حالة الدورة: draft / published / archived
- مستوى الدورة: beginner / intermediate / advanced

**API:** `GET/POST/PATCH /api/academy/admin/courses`

### 6.3 التصنيفات `/academy/admin/categories`
- إضافة / تعديل / حذف تصنيفات الدورات

**API:** `GET/POST/PATCH/DELETE /api/academy/admin/categories`

### 6.4 الأساتذة `/academy/admin/teachers`
- قائمة الأساتذة + إحصائيات

**API:** `GET /api/academy/admin/teachers`

### 6.5 طلبات الأساتذة `/academy/admin/teacher-applications`
- طلبات انضمام الأساتذة
- قبول / رفض مع سبب

**API:** `GET/PATCH /api/academy/admin/teacher-applications`

### 6.6 الطلاب `/academy/admin/students`
- طلاب الأكاديمية + إحصائيات

**API:** `GET /api/academy/admin/students`

### 6.7 المسارات التعليمية `/academy/admin/learning-paths`
- إنشاء وإدارة المسارات التعليمية
- تعيين مسؤول لمسار فقهي
- مراحل المسار مع的状态 (locked/unlocked/completed)

**API:** `GET/POST/PATCH/DELETE /api/academy/admin/paths`

### 6.8 التحكم بالصلاحيات `/academy/admin/access-control`
- إدارة الصلاحيات
- تغيير `has_academy_access`
- سجل «من غيّر ومتى»

**API:** `GET/PATCH /api/academy/admin/users`

### 6.9 الدعوات `/academy/admin/invitations`
- إرسال دعوة + تتبعها

**API:** `GET/POST /api/academy/admin/invitations`

### 6.10 المسابقات `/academy/admin/competitions`
- إنشاء وإدارة المسابقات
- تحديد المشاركين
- إدارة الملفات المطلوبة
- نطاق المسابقة: academy / halaqah

**API:** `GET/POST/PATCH/DELETE /api/academy/admin/competitions`

### 6.11 لوحة المتصدرين `/academy/admin/leaderboard`
- إدارة النقاط والترتيب
- سجل كيف اكتسب الطلاب نقاطهم

**API:** `GET /api/academy/admin/leaderboard`

### 6.12 الشارات `/academy/admin/badges`
- إنشاء وإدارة الشارات
- رفع صور مخصصة
- تعديل الشروط
- منح يدوي
- تصنيفات: recitation, courses, tasks, streak, competitions, special

**API:** `GET/POST/PATCH/DELETE /api/academy/admin/badges`

### 6.13 المنتدى `/academy/admin/forum`
- إدارة المنتدى والإشراف
- إنشاء منتديات
- حذف ردود مخالفة

**API:** `GET/POST/PATCH/DELETE /api/academy/admin/forum`

### 6.14 الفقه `/academy/admin/fiqh`
- مراجعة كل الأسئلة والإجابات
- تعيين مشرفي/مسؤولي الفقه

**API:** `GET/PATCH /api/academy/admin/fiqh`

### 6.15 الإعلانات `/academy/admin/announcements`
- نشر الإعلانات
- استهداف أدوار محددة

**API:** `GET/POST /api/academy/admin/announcements`

### 6.16 التقارير `/academy/admin/reports`
- تقارير الالتحاقات والإكمال والأساتذة
- Export (CSV / PDF)

**API:** `GET /api/academy/admin/analytics`

### 6.17 التحليلات `/academy/admin/analytics`
- رسوم بيانية تفاعلية
- تصدير التحليلات
- تحليلات جغرافية

**API:** `GET /api/academy/admin/analytics`

### 6.18 الحلقات `/academy/admin/halaqat`
- إنشاء حلقة (اسم + جنس + أستاذ + توقيت + تصنيف)
- إدارة الطلاب وتتبع الحضور
- ربط بالدورة

**API:** `GET/POST/PATCH/DELETE /api/academy/admin/halaqat`

### 6.19 الإعدادات `/academy/admin/settings`
- إعدادات الأكاديمية (10 أقسام، ~81 حقل)
- التحكم الكامل في سلوك المنصة

**الأقسام:**
1. **General** — اسم الأكاديمية، الشعار، Favicon، اللغة، المنطقة الزمنية
2. **Registration** — التسجيل الذاتي، الموافقة، الحقول الإلزامية
3. **Courses & Content** — موافقة المشرف، حدود الحجم، خدمة التخزين
4. **Live Sessions** — مزود الفيديو، مدة الجلسة، التذكيرات
5. **Gamification** — النقاط، المستويات، الشارات، Leaderboard
6. **Notifications & Email** — SMTP، أحداث الإيميل، التوقيتات
7. **Forum & Fiqh** — تفعيل المنتدى/Fiqh، الإعدادات
8. **Security & Privacy** — الجلسات، 2FA، IP Whitelist، Rate Limiting
9. **Maintenance** — وضع الصيانة، مسح Cache، Backup

**API:**
- `GET /api/academy/admin/settings` — جلب الإعدادات
- `PUT /api/academy/admin/settings` — حفظ الإعدادات
- `POST /api/academy/admin/settings/test-email` — اختبار SMTP
- `POST /api/academy/admin/settings/cache-clear` — مسح Cache
- `POST /api/academy/admin/settings/backup` — تصدير Backup

### 6.20 إدارة النقاط `/academy/admin/points`
- إدارة قيم النقاط لكل حدث
- حدود المستويات

**API:** `GET/PUT /api/academy/admin/points`

### 6.21 المشرفون `/academy/admin/supervisors`
- تعيين وإدارة المشرفين

**API:** `GET/POST/PATCH/DELETE /api/academy/admin/supervisors`

### 6.22 الأرشيف `/academy/admin/archive`
- الأرشيف العام

### 6.23 المحادثات `/academy/admin/conversations`
- مراجعة المحادثات

### 6.24 المستخدمون `/academy/admin/users`
- إدارة المستخدمين العام

### 6.25 المكتبة `/academy/admin/library`
- إدارة المحتوى المكتبي

### 6.26 السلاسل `/academy/admin/series`
- إدارة السلاسل التعليمية

### 6.27 الدورات العامة `/academy/admin/public-lessons`
- إدارة الدورات العامة المفتوحة

### 6.28 الشهادات `/academy/admin/certificates`
- إدارة الشهادات

### 6.29 الإعدادات `/academy/admin/video-settings`
- إعدادات الفيديو والبث

---

## 7. صفحات وميزات ولي الأمر

### 7.1 لوحة التحكم `/academy/parent`
- ملخص أداء كل الأبناء المربوطين
- تنبيهات (مهام متأخرة، غياب)
- إحصائيات سريعة

**API:** `GET /api/academy/parent/overview`

### 7.2 ربط الابن `/academy/parent/link-child`
- إدخال إيميل ابن
- اختيار نوع العلاقة (أب/أم/ولي)
- إرسال طلب ربط

**API:** `POST /api/academy/parent/link-child`

### 7.3 الأبناء `/academy/parent/children`
- كل الأبناء + الدورات النشطة
- نسبة التقدم
- إزالة الربط

**API:** `GET /api/academy/parent/children`

### 7.4 التقارير `/academy/parent/reports`
- اختيار ابن + فترة زمنية
- عرض التقرير (حضور، مهام، درجات)
- تصدير PDF

**API:** `GET /api/academy/parent/reports`

### 7.5 التقدم `/academy/parent/progress`
- رسوم بيانية لنسب الإكمال
- شارات الابن + المستوى والنقاط
- الجلسات الحاضرة/الغائبة
- مقارنة بين الأبناء

**API:** `GET /api/academy/parent/progress`

### 7.6 الإشعارات `/academy/parent/notifications`
- إشعارات أداء الأبناء

### 7.7 المحادثات `/academy/parent/messages`
- محادثة مع الشيخ بشكل ثنائي

**API:** `GET /api/academy/parent/reader-conversations`

### 7.8 القيود `/academy/parent/restrictions`
- تحديد السور/المسارات المسموح بها للابن
- locked / مخفية في واجهة الابن

**API:** `GET/POST /api/academy/parent/restrictions`

### 7.9 الملف الشخصي `/academy/parent/profile`
- تعديل البيانات

### 7.10 التقويم `/academy/parent/calendar`
- جدول المواعيد للأبناء

### 7.11 الأساتذة `/academy/parent/teachers`
- عرض الأساتذة المرتبطين بالأبناء

---

## 8. صفحات وميزات المشرفين

### 8.1 مشرف المحتوى `/academy/content-supervisor`
| Route | الوصف |
|-------|-------|
| `/academy/content-supervisor` | لوحة تحكم: الدروس المنتظرة بحالات |
| `/academy/content-supervisor/lessons` | مراجعة الدروس (بانتظار المراجعة / مقبول / مرفوض) |
| `/academy/content-supervisor/courses` | إدارة الدورات |
| `/academy/content-supervisor/paths` | متابعة المسارات |
| `/academy/content-supervisor/academy-paths` | إدارة مسارات الأكاديمية |
| `/academy/content-supervisor/series` | إدارة السلاسل |
| `/academy/content-supervisor/archive` | الأرشيف |
| `/academy/content-supervisor/messages` | المراسلات |
| `/academy/content-supervisor/notifications` | الإشعارات |
| `/academy/content-supervisor/profile` | الملف الشخصي |

**سير العمل:** قبول / رفض مع كتابة سبب

### 8.2 مشرف الفقه `/academy/fiqh-supervisor`
| Route | الوصف |
|-------|-------|
| `/academy/fiqh-supervisor` | لوحة تحكم: الأسئلة بحالات (جديد / قيد المراجعة / مُجاب / مرفوض) |
| `/academy/fiqh-supervisor/questions` | قائمة الأسئلة المعلقة + كتابة إجابة (rich text) + النشر |
| `/academy/fiqh-supervisor/messages` | نظام مراسلة |
| `/academy/fiqh-supervisor/notifications` | الإشعارات |
| `/academy/fiqh-supervisor/profile` | الملف الشخصي |

### 8.3 مراقب الجودة `/academy/supervisor/quality`
- إحصائيات الجودة (متوسط درجات الأساتذة، وقت التقييم، الشكاوى)
- عرض التقييمات (قراءة فقط)
- كتابة تقرير وإرساله للأدمن

### 8.4 مشرف عام `/academy/supervisor`
| Route | الوصف |
|-------|-------|
| `/academy/supervisor` | لوحة تحكم عامة |
| `/academy/supervisor/content` | مراجعة المحتوى |
| `/academy/supervisor/forum` | إشراف المنتدى |
| `/academy/supervisor/teachers` | متابعة الأساتذة |
| `/academy/supervisor/notifications` | الإشعارات |
| `/academy/supervisor/quality` | مراقبة الجودة |

### 8.5 مسؤول الفقه `/academy/officer/fiqh`
- إدارة الأسئلة الفقهية المخصصة

---

## 9. الميزات المستعرضة (Cross-cutting Features)

### 9.1 نظام النقاط
| الحدث | النقاط |
|-------|--------|
| تسجيل تلاوة | +10 |
| تلاوة مقبولة بـ «إتقان» | +30 |
| إنهاء مهمة | +15 |
| حضور درس | +20 |
| يوم Streak جديد | +5 |
| إنهاء جزء كامل | +100 |
| حضور جلسة | +20 |
| إجابة في المنتدى | +25 |
| فوز مسابقة | +500 |
| فوز ثاني في مسابقة | +300 |
| فوز ثالث في مسابقة | +150 |
| مضاعفة Streak ≥ 3 أيام | ×2.0 |
| مضاعفة Streak ≥ 7 أيام | ×2.0 |
| مضاعفة Streak ≥ 30 أيام | ×2.0 |

**الملفات:** `lib/academy/gamification.ts`, `lib/academy/points.ts`

### 9.2 نظام المستويات
| المستوى | النقاط المطلوبة |
|--------|----------------|
| مبتدئ (Beginner) | 0–500 |
| متوسط (Intermediate) | 500–2,000 |
| متقدم (Advanced) | 2,000–5,000 |
| حافظ (Hafiz) | 5,000–10,000 |
| خاتم (Master) | 10,000+ |

- ترقية تلقائية + إشعار + فتح مزايا إضافية

### 9.3 عداد الـ Streak
- يزيد بتسجيل تلاوة كل يوم
- يصفر بفقدان يوم
- إشعار قرب نهاية اليوم (cron job)
- جدول: `user_points.streak_days`, `user_points.longest_streak`

### 9.4 الشارات

#### الشارات التلقائية
| الشارة | الشرط | النقاط |
|--------|-------|--------|
| أول تلاوة | أول recitation | +20 |
| أسبوع كامل Streak 7 | 7 أيام متتالية | +70 |
| حافظ جزء عم | إتمام الجزء 30 | +200 |
| مئة تلاوة | 100 recitation | +150 |
| متقن التجويد | إكمال مسار التجويد | +300 |
| شهر رمضان | نشاط رمضان | +250 |
| الختمة الكاملة | ختم القرآن | +1,000 |
| نجم الحلقة | أفضل أداء في الحلقة | +180 |
| أول دورة | التسجيل في أول دورة | - |
| خمس دورات | 5 دورات مكتملة | - |
| عشر دورات | 10 دورات مكتملة | - |
| أول مهمة | إتمام أول مهمة | - |
| خبير المهام | 50 مهمة مكتملة | - |
| نهاري | تسجيل قبل الظهر | - |
| مسائي | تسجيل بعد المغرب | - |
| مساعد | الإجابة في المنتدى | - |

**النظام:** `badge_definitions` table + `badges` table (user earned)

### 9.5 المسارات التعليمية

#### مسارات القرآن
- **حفظ القرآن:** مرتب من جزء عم للختمة
  - وحدات: juz / surah / hizb / page / custom range
  - اتجاه: asc (من الصغير للكبير) أو desc
- **التجويد:** مراحل متسلسلة (10 مراحل افتراضية)
  - تفتح فقط بعد اجتياز السابقة بتقييم المقرئ
  - المراحل: مخارج الحروف → صفات الحروف → أحكام النون → ... → تطبيق ختامي

#### مسارات العلوم الشرعية
- الفقه (10 مراحل افتراضية)
- العقيدة
- السيرة
- التفسير

**الملفات:** `lib/memorization-paths.ts`, `lib/tajweed-paths.ts`

### 9.6 المسابقات
- مسابقة التلاوة الشهرية
- مسابقة رمضان (تتبع الآيات المحفوظة شهرياً)
- مسابقة التجويد (تحديد الأحكام المطلوبة)
- نطاق المسابقة: academy / halaqah
- تحكم Judges + Rank + Points
- إعلان فائز + شارة + نقاط مضاعفة

**API:** `GET/POST/PATCH/DELETE /api/academy/admin/competitions`

### 9.7 لوحة المتصدرين (Leaderboard)
- ترتيب حسب النقاط
- فلتر: الحلقة / المنصة كاملة
- تحديث ترتيب لحظي + Animation
- ترتيب مسابقات منفصل

### 9.8 الفيديو كول المدمج
- **المزود الأساسي:** LiveKit (محلي)
- **المزودات البديلة:** Zoom / Google Meet
- إنشاء جلسة + إضافة رابط
- إرسال لطالب واحد أو مجموعة
- تنتهي الصلاحية بعد انتهاء الجلسة
- Waiting Room support
- Webhook للمتابعة

**API:**
- `POST /api/livekit/token` — إنشاء توكن
- `POST /api/livekit/public-token` — توكن عام
- `GET /api/livekit/waiting-room` — غرفة الانتظار
- `POST /api/livekit/webhook` — متابعة الجلسات

### 9.9 إحصائيات الأداء
- رسوم بيانية لنسب الإكمال الأسبوعية والشهرية
- معدل النشاط + أكثر الدورات اشتراكاً
- تصدير CSV / PDF
- تحليلات جغرافية

### 9.10 المكتبة `/academy/library`
- كتب ومراجع إسلامية
- تصنيفات متعددة
- عرض بالغلاف والعنوان

**API:** `GET /api/academy/admin/library`

### 9.11 السلاسل `/academy/admin/series`
- سلاسل دروس مرتبة
- إدارة الحلقات

### 9.12 الدورات العامة
- دورات مفتوحة للعموم
- لا تتطلب تسجيل
- مشاركة عبر روابط مباشرة

### 9.13 التقويم الموحد
- مواعيد الجلسات والدurus والمهام
- فلترة حسب النوع
- دمج مع Google Calendar (مخطط)

### 9.14 المراسلات
- محادثات ثنائية
- بحث بالاسم
- آخر رسالة + unread count
- محادثات ولي الأمر مع الأساتذة

### 9.15 نظام التقييم
- تقييم الدروس من الطلاب
- تقييم الأساتذة (مراقبة الجودة)
- درجات المهام

### 9.16 نظام الشهادات
- شهادات إتمام الدورات
- توليد PDF تلقائي
- بيانات إصدار قابلة للتعديل
- تصميم مخصص مع شعار الأكاديمية

---

## 10. الـ APIs الرئيسية

### 10.1 Auth & Access
| Endpoint | Methods | الوصف |
|----------|---------|-------|
| `/api/auth/login` | POST | تسجيل الدخول |
| `/api/auth/register` | POST | التسجيل |
| `/api/me` | GET | بيانات المستخدم الحالي |
| `/api/academy/admin/access-control` | GET/PATCH | إدارة الصلاحيات |
| `/api/academy/admin/points` | GET/PUT | إدارة النقاط |
| `/api/academy/student/points` | GET | نقاط الطالب |

### 10.2 الطالب
| Endpoint | Methods | الوصف |
|----------|---------|-------|
| `/api/academy/student/stats` | GET | إحصائيات الطالب |
| `/api/academy/student/courses` | GET | دورات الطالب |
| `/api/academy/student/enrollments` | GET | طلبات الالتحاق |
| `/api/academy/student/calendar` | GET | التقويم |
| `/api/academy/student/memorization` | GET/POST | الحفظ |
| `/api/academy/student/badges` | GET | الشارات |
| `/api/academy/student/parent-requests` | GET/POST | طلبات ولي الأمر |
| `/api/academy/student/competitions` | GET/POST | المسابقات |
| `/api/academy/student/points` | GET | النقاط |
| `/api/academy/student/tasks` | GET/POST | المهام |
| `/api/academy/student/sessions` | GET | الجلسات |
| `/api/academy/student/lessons/[id]` | GET | الدرس |
| `/api/academy/student/paths` | GET | المسارات |
| `/api/academy/student/certificates` | GET | الشهادات |
| `/api/academy/student/teachers` | GET | الأساتذة |
| `/api/academy/student/fiqh` | GET/POST | الفقه |
| `/api/academy/student/series` | GET | السلاسل |
| `/api/academy/student/badges` | GET | الشارات |

### 10.3 الأستاذ
| Endpoint | Methods | الوصف |
|----------|---------|-------|
| `/api/academy/teacher/courses` | GET/POST | الدورات |
| `/api/academy/teacher/tasks` | GET/POST/PATCH/DELETE | المهام |
| `/api/academy/teacher/students` | GET/POST | الطلاب |
| `/api/academy/teacher/sessions` | GET/POST/PATCH/DELETE | الجلسات |
| `/api/academy/teacher/live-session` | POST/PATCH | البث المباشر |
| `/api/academy/teacher/memorization` | GET/POST | الحفظ |
| `/api/academy/teacher/invitations` | GET/POST | الدعوات |
| `/api/academy/teacher/calendar` | GET | التقويم |
| `/api/academy/teacher/enrollment-requests` | GET | طلبات الالتحاق |
| `/api/academy/teacher/certificates` | GET | الشهادات |
| `/api/academy/teacher/paths` | GET | المسارات |
| `/api/academy/teacher/public-lessons` | GET/POST | الدورات العامة |
| `/api/academy/teacher/profile` | GET/PATCH | الملف الشخصي |
| `/api/academy/teacher/competitions` | GET | المسابقات |

### 10.4 الأدمن
| Endpoint | Methods | الوصف |
|----------|---------|-------|
| `/api/academy/admin/stats` | GET | إحصائيات عامة |
| `/api/academy/admin/courses` | GET/POST/PATCH | الدورات |
| `/api/academy/admin/categories` | GET/POST/PATCH/DELETE | التصنيفات |
| `/api/academy/admin/teachers` | GET | الأساتذة |
| `/api/academy/admin/teacher-applications` | GET/PATCH | طلبات الأساتذة |
| `/api/academy/admin/students` | GET | الطلاب |
| `/api/academy/admin/paths` | GET/POST/PATCH/DELETE | المسارات |
| `/api/academy/admin/invitations` | GET/POST | الدعوات |
| `/api/academy/admin/competitions` | GET/POST/PATCH/DELETE | المسابقات |
| `/api/academy/admin/leaderboard` | GET | المتصدرين |
| `/api/academy/admin/badges` | GET/POST/PATCH/DELETE | الشارات |
| `/api/academy/admin/forum` | GET/POST/PATCH/DELETE | المنتدى |
| `/api/academy/admin/fiqh` | GET/PATCH | الفقه |
| `/api/academy/admin/announcements` | GET/POST | الإعلانات |
| `/api/academy/admin/analytics` | GET | التحليلات |
| `/api/academy/admin/halaqat` | GET/POST/PATCH/DELETE | الحلقات |
| `/api/academy/admin/settings` | GET/PUT | الإعدادات |
| `/api/academy/admin/supervisors` | GET/POST/PATCH/DELETE | المشرفون |
| `/api/academy/admin/users` | GET/PATCH | المستخدمون |
| `/api/academy/admin/library` | GET/POST | المكتبة |
| `/api/academy/admin/series` | GET/POST | السلاسل |
| `/api/academy/admin/public-lessons` | GET/POST | الدورات العامة |
| `/api/academy/admin/certificates` | GET | الشهادات |
| `/api/academy/admin/video-settings` | GET/PUT | إعدادات الفيديو |
| `/api/academy/admin/archive` | GET | الأرشيف |
| `/api/academy/admin/contact-messages` | GET | رسائل التواصل |

### 10.5 ولي الأمر
| Endpoint | Methods | الوصف |
|----------|---------|-------|
| `/api/academy/parent/overview` | GET | نظرة عامة |
| `/api/academy/parent/link-child` | POST | ربط ابن |
| `/api/academy/parent/children` | GET | الأبناء |
| `/api/academy/parent/progress` | GET | التقدم |
| `/api/academy/parent/reports` | GET | التقارير |
| `/api/academy/parent/restrictions` | GET/POST | القيود |
| `/api/academy/parent/reader-conversations` | GET | المحادثات |
| `/api/academy/parent/calendar` | GET | التقويم |
| `/api/academy/parent/teachers` | GET | الأساتذة |

### 10.6 الفقه
| Endpoint | Methods | الوصف |
|----------|---------|-------|
| `/api/academy/fiqh` | GET/POST | الأسئلة |
| `/api/academy/fiqh/[id]` | GET/PATCH | سؤال محدد |
| `/api/academy/fiqh/categories` | GET | التصنيفات |
| `/api/academy/fiqh/fields` | GET | الحقول المخصصة |
| `/api/academy/fiqh/me` | GET | أسئلتي |

### 10.7 المنتدى
| Endpoint | Methods | الوصف |
|----------|---------|-------|
| `/api/academy/forum` | GET/POST | الموضوعات |
| `/api/academy/forum/[id]` | GET/PATCH/DELETE | موضوع محدد |

### 10.8 المحادثات
| Endpoint | Methods | الوصف |
|----------|---------|-------|
| `/api/conversations` | GET/POST | المحادثات |
| `/api/conversations/[id]` | GET | محادثة محددة |
| `/api/unread-counts` | GET | عدد غير المقروء |

### 10.9 الشهادات
| Endpoint | Methods | الوصف |
|----------|---------|-------|
| `/api/certificate` | GET | الشهادة |
| `/api/certificate-pdf` | GET | تحميل PDF |

### 10.10 Leaderboard
| Endpoint | Methods | الوصف |
|----------|---------|-------|
| `/api/academy/leaderboard` | GET | المتصدرين |

### 10.11 LiveKit
| Endpoint | Methods | الوصف |
|----------|---------|-------|
| `/api/livekit/token` | POST | توكن خاص |
| `/api/livekit/public-token` | POST | توكن عام |
| `/api/livekit/waiting-room` | GET | غرفة الانتظار |
| `/api/livekit/webhook` | POST | متابعة |

### 10.12 خدمات عامة
| Endpoint | Methods | الوصف |
|----------|---------|-------|
| `/api/upload` | POST | رفع ملفات |
| `/api/upload-audio` | POST | رفع صوت |
| `/api/upload-pdf` | POST | رفع PDF |
| `/api/audio-proxy` | GET | بروكسي الصوت |
| `/api/pdf-proxy` | GET | بروكسي PDF |
| `/api/notifications` | GET | الإشعارات |
| `/api/community/articles` | GET/POST | مقالات المجتمع |
| `/api/halaqat` | GET | الحلقات |
| `/api/stats` | GET | إحصائيات عامة |
| `/api/prayer-times` | GET | أوقات الصلاة |
| `/api/public-settings` | GET | الإعدادات العامة |

---

## 11. الإشعارات والـ Cron Jobs

### 11.1 قنوات الإشعارات
- داخل المنصة (Bell icon مع pulse animation)
- البريد الإلكتروني (SMTP عبر Nodemailer)

### 11.2 مناسبات الإشعارات
| الحدث | المستلم |
|-------|---------|
| قبول/رفض طلب أستاذ | الأستاذ |
| وصول طلب انضمام لدورة | الأستاذ |
| قبول/رفض الانضمام | الطالب |
| وصول مهمة جديدة | الطالب |
| تقييم مهمة | الطالب |
| وصول رابط جلسة | الطالب |
| تذكير قبل ساعة من الجلسة | الطالب |
| تذكير قبل 10 دقائق | الطالب |
| وصول رد في موضوع | المنشئ |
| ترقية مستوى | الطالب |
| شارة جديدة | الطالب |
| تحذير الـ Streak قرب نهاية اليوم | الطالب |
| طلب ربط ولي أمر | الابن + ولي الأمر |
| جواب الفقه | السائل |
| رفض السؤال مع سبب | السائل |
| تقرير ولي الأمر الأسبوعي | ولي الأمر |
| تذكير الورد اليومي | الطالب |

### 11.3 Cron Jobs
| Endpoint | الوصف | التوقيت |
|----------|-------|---------|
| `/api/cron/session-reminders` | تذكيرات الجلسات | كل ساعة |
| `/api/cron/task-reminders` | تذكيرات المهام + تنبيه متأخرة | يومي صباحاً |
| `/api/cron/streak-reminders` | تذكيرات الـ Streak | يومي مساءً |
| `/api/cron/parent-weekly-reports` | تقارير ولي الأمر الأسبوعية | أسبوعي |
| `/api/cron/admin-activity-reports` | تقارير الإدارة | أسبوعي/شهري |
| `/api/cron/academy-reminders` | تذكيرات الأكاديمية العامة | يومي |
| `/api/cron/check-expirations` | فحص الانتهاءات | يومي |
| `/api/cron/werd-reminders` | تذكيرات الورد اليومي | يومي |
| `/api/cron/auto-end-sessions` | إنهاء الجلسات المنتهية | كل 5 دقائق |
| `/api/cron/recover-multipart` | استرداد الملفات المتعددة | يومي |
| `/api/cron/reminders` | تذكيرات عامة | يومي |

---

## 12. الأمان والصلاحيات

### 12.1 حماية API Routes
- كل API routes محمية بـ authentication و authorization
- JWT verification في كل request
- RBAC middleware للتحقق من الأدوار

### 12.2 قواعد الوصول
| القاعدة | التفصيل |
|---------|---------|
| ولي الأمر | لا يصل لبيانات طالب غير مربوط به |
| الطالب | لا يدخل `/academy/admin` |
| الأستاذ | لا يدخل `/academy/admin` ولا `/student` |
| المشرف | يصل فقط لأقسامه المحددة |
| الأدمن | يصل لكل شيء |

### 12.3 الأمان التقني
- JWT مع HS256 + مدة صلاحية 30 يوم
- HttpOnly cookies
- SSL للاتصال بقاعدة البيانات
- Rate Limiting (مخطط)
- Input validation مع Zod
- SQL injection protection (parameterized queries)
- XSS protection (React auto-escaping)

### 12.4 المصادقة المزدوجة (2FA)
- مدعومة عبر better-auth
- Email OTP
- Authenticator App

### 12.5 سجل الأنشطة
- `activity_log` table
- تتبع: من فعل ماذا ومتى
- لل更改ات الحساسة (صلاحيات، إعدادات)

---

## 13. متطلبات الواجهة (UI/UX)

### 13.1 نظام الألوان
| العنصر | اللون |
|--------|-------|
| Primary (الأكاديمية) | `#1E3A5F` |
| Secondary | مشتقات الأزرق |
| Danger | `#EF4444` |
| Success | `#22C55E` |
| Warning | `#FBBF24` |
| Background | أبيض/رمادي فاتح |

### 13.2 Dark Mode
- على كل صفحات الأكاديمية
- لا توجد عناصر/نصوص غير مقروءة
- Theme Provider مدمج

### 13.3 Responsive Design
- صفحة الدرس (فيديو) على الموبايل
- شات الأكاديمية على الموبايل
- التقويم يتحول إلى list view
- صفحة تسليم المهام
- كل القوائم تشتغل على الشاشات الصغيرة
- Mode Switcher يتكيف مع الشاشات

### 13.4 Animations
| الميزة | Animation |
|--------|-----------|
| Mode Switcher | fade + slide |
| Progress bar | animated |
| Badge الإشعارات الجديدة | Pulse |
| Step indicator عند الانضمام | Step animation |
| Leaderboard تغيير الترتيب | Sort animation |
| Skeleton Loaders | smooth rectangles |

### 13.5 المكونات (UI Components)
- shadcn/ui (بناء على Radix UI)
- Dialog, Dropdown, Tabs, Accordion
- Toast notifications (Sonner)
- Command palette (cmdk)
- Calendar (react-day-picker)
- Charts (Recharts)
- Form validation (React Hook Form + Zod)

---

## 14. الأداء والاستقرار

### 14.1 متطلبات الأداء
- زمن تحميل أقل من 3 ثوانٍ
- لا توجد memory leaks
- لا توجد طلبات API متكررة
- كل الصفحات مربوطة بـ DB (لا mock data)

### 14.2 استراتيجيات التحسين
- SWR للـ caching والـ revalidation
- Optimistic updates مع rollback
- Skeleton Loaders بدلاً من Spinners
- Image optimization (Sharp)
- Code splitting تلقائي (Next.js)

### 14.3 الاختبارات
- **Unit Tests:** Vitest
- **Component Tests:** Testing Library
- **API Mocking:** MSW
- **E2E Tests:** مخطط (Playwright)

---

## 15. هيكل قاعدة البيانات

### 15.1 الجداول الرئيسية
| الجدول | الوصف |
|--------|-------|
| `users` | المستخدمون الأساسيون |
| `courses` | الدورات |
| `lessons` | الدروس |
| `enrollments` | الالتحاقات |
| `tasks` | المهام |
| `task_submissions` | تسليمات المهام |
| `sessions` | الجلسات |
| `session_attendance` | حضور الجلسات |
| `user_points` | نقاط المستخدمين |
| `points_log` | سجل النقاط |
| `badge_definitions` | تعريفات الشارات |
| `badges` | الشارات المكتسبة |
| `competitions` | المسابقات |
| `competition_entries` | مشاركات المسابقات |
| `memorization_records` | سجلات الحفظ |
| `memorization_goals` | أهداف الحفظ |
| `memorization_paths` | مسارات الحفظ |
| `memorization_path_units` | وحدات مسارات الحفظ |
| `tajweed_paths` | مسارات التجويد |
| `tajweed_stages` | مراحل التجويد |
| `learning_paths` | المسارات التعليمية |
| `learning_path_stages` | مراحل المسارات |
| `fiqh_questions` | أسئلة الفقه |
| `fiqh_answers` | إجابات الفقه |
| `fiqh_categories` | تصنيفات الفقه |
| `fiqh_custom_fields` | حقول الفقه المخصصة |
| `forum_topics` | مواضيع المنتدى |
| `forum_replies` | ردود المنتدى |
| `forum_categories` | تصنيفات المنتدى |
| `conversations` | المحادثات |
| `messages` | الرسائل |
| `notifications` | الإشعارات |
| `halaqat` | الحلقات |
| `halaqah_enrollments` | التحاقات الحلقات |
| `certificates` | الشهادات |
| `announcements` | الإعلانات |
| `invitations` | الدعوات |
| `parent_children` | علاقة ولي الأمر بالابن |
| `parent_restrictions` | قيود ولي الأمر |
| `activity_log` | سجل الأنشطة |
| `academy_system_settings` | إعدادات النظام |
| `categories` | التصنيفات العامة |
| `series` | السلاسل |
| `books` | الكتب |
| `book_categories` | تصنيفات الكتب |
| `public_lessons` | الدورات العامة |
| `contact_messages` | رسائل التواصل |
| `supervisors` | المشرفون |
| `application_questions` | أسئلة التقديم |

### 15.2 العلاقات الأساسية
```
users ──< enrollments >── courses
users ──< tasks >── courses
users ──< task_submissions >── tasks
users ──< sessions >── courses
users ──< session_attendance >── sessions
users ──< user_points
users ──< points_log
users ──< badges >── badge_definitions
users ──< memorization_records
users ──< memorization_goals
users ──< parent_children >── users (parent)
courses ──< lessons
courses ──< enrollments >── users
memorization_paths ──< memorization_path_units
tajweed_paths ──< tajweed_stages
learning_paths ──< learning_path_stages
competitions ──< competition_entries >── users
fiqh_questions ──< fiqh_answers
forum_topics ──< forum_replies
conversations ──< messages
halaqat ──< halaqah_enrollments >── users
```

---

## 16. مراحل التطوير

### المرحلة 1: الأساس (مكتملة ✅)
- [x] نظام المستخدمين والأدوار
- [x] المصادقة (JWT)
- [x] قاعدة البيانات (Supabase/PostgreSQL)
- [x] واجهة عامة

### المرحلة 2: الدورات والدروس (مكتملة ✅)
- [x] إنشاء وإدارة الدورات
- [x] رفع الدروس (فيديو/PDF)
- [x] نظام الالتحاق
- [x] تتبع التقدم

### المرحلة 3: الحفظ والمراجعة (مكتملة ✅)
- [x] سجل الحفظ
- [x] أهداف الحفظ
- [x] مسارات الحفظ
- [x] خريطة المصحف البصرية

### المرحلة 4: Gamification (مكتملة ✅)
- [x] نظام النقاط
- [x] نظام المستويات
- [x] عداد الـ Streak
- [x] الشارات

### المرحلة 5: الميزات الاجتماعية (مكتملة ✅)
- [x] المنتدى
- [x] الفقه
- [x] المحادثات
- [x] الإشعارات

### المرحلة 6: ولي الأمر (مكتملة ✅)
- [x] ربط الابن
- [x] متابعة التقدم
- [x] التقارير
- [x] القيود

### المرحلة 7: البث المباشر (مكتملة ✅)
- [x] LiveKit integration
- [x] Zoom/Google Meet support
- [x] غرفة الانتظار

### المرحلة 8: المسارات التعليمية (مكتملة ✅)
- [x] مسارات الحفظ
- [x] مسارات التجويد
- [x] مسارات العلوم الشرعية

### المرحلة 9: المسابقات (مكتملة ✅)
- [x] نظام المسابقات
- [x] التسجيل والتقديم
- [x] التقييم

### المرحلة 10: الإعدادات والتحليلات (مكتملة ✅)
- [x] إعدادات الأدمن (10 أقسام)
- [x] التحليلات والتقارير
- [x] Export (CSV/PDF)

### المرحلة 11: التحسينات (مخطط لها 🔜)
- [ ] Rate Limiting
- [ ] E2E Tests (Playwright)
- [ ] PWA support
- [ ] Offline mode للحفظ
- [ ] ترجمة شاملة (عربي/إنجليزي)
- [ ] تحسين الأداء
- [ ] Accessibility audit

---

## 17. ملاحظات تقنية مهمة

### 17.1 ملفات Gamification
- `lib/academy/gamification.ts` — **المصدر الوحيد للحقيقة** لنقاط وشارات الإنتاج
- `lib/academy/points.ts` — مكتوب ضد schema قديم، قيد الإهمال (deprecated)
- `lib/academy/badges.ts` — إدارة تعريفات الشارات المكتسبة

### 17.2 نظام الترجمة
- `lib/i18n/` — نظام الترجمة المدمج
- `useI18n()` hook لاستخدام الترجمات
- دعم RTL/LTR

### 17.3 التخزين
- S3 (AWS) للملفات الكبيرة
- Cloudinary كبديل
- Supabase Storage للملفات الصغيرة

### 17.4 قنوات الاتصال
- **LiveKit:** فيديو محلي (مدمج)
- **Zoom/Google Meet:** فيديو خارجي (روابط مشاركة)
- **Nodemailer:** إيميلات (SMTP)

---

*تم إنشاء هذا المستند بناءً على تحليل شامل لكود المشروع.*
*آخر تحديث: 21 يونيو 2026*
