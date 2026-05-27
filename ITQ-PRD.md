# PRD — منصة إتقان (أكاديمية العلوم الإسلامية)

منصة تعليمية إسلامية متكاملة لـ **أكاديمية العلوم الإسلامية** تجمع بين الدروس المباشرة والدورات التفاعلية مع نظام متقدم للحفظ والمراجعة.

---

## 1. الأدوار (User Roles)

### أدوار الأكاديمية
- **طالب الأكاديمية (Academy Student)** — `/academy/student`
- **الأستاذ (Teacher)** — `/academy/teacher`
- **أدمن الأكاديمية (Academy Admin)** — `/academy/admin`
- **ولي الأمر (Parent)** — `/academy/parent`
- **المشرفون (Supervisors)** — `/academy/supervisor`:
  - مشرف المحتوى
  - مسؤول/مشرف الفقه
  - مراقب الجودة

---

## 2. البنية التحتية (Foundation)

### قاعدة البيانات — جدول `users`
حقول التحكم في الوصول:
- `has_academy_access` (boolean) — صلاحية دخول الأكاديمية
- `platform_preference` (text) — المنصة المفضلة

### صفحة التسجيل `/register`
- خيارات الانضمام: «الأكاديمية فقط» / «الأكاديمية + مقرأة»
- الخيار الافتراضي: «الأكاديمية + مقرأة»
- التوجيه بعد التسجيل:
  - «الأكاديمية فقط» → `/academy/student`
  - «الأكاديمية + مقرأة» → `/academy/student` مع ظهور Mode Switcher
- حفظ الحقول `has_academy_access` و `platform_preference` في DB

### Mode Switcher
- يظهر للحسابات المزدوجة والأدمن
- يخفى عن الحسابات «الأكاديمية فقط»
- يبدّل بين `/academy/student` والمنصات الأخرى
- لون الأكاديمية: أزرق `#1E3A5F` ومشتقاته
- مع Animation (fade + slide) عند التبديل

### Middleware (حماية المسارات)
- توجيه المستخدمين غير المسجلين لـ `/login`
- منع دخول `/academy/student` لمن ليس له `has_academy_access`
- منع دخول `/academy/parent` لمن ليس دوره `parent`
- منع دخول `/academy/teacher` لمن ليس دوره `teacher`
- حماية كل API routes بـ authentication و authorization

---

## 3. صفحات وميزات كل دور

### 3.1 — طالب الأكاديمية (`/academy/student`)

| Route | الوصف |
|-------|-------|
| `/academy/student` | لوحة التحكم: إحصائيات (الدورات، النقاط، المستوى، الـ Streak) + الجلسات القادمة |
| `/academy/student/courses/browse` | تصفح الدورات مصنفة + فلترة بالتصنيف وبالمستوى (مبتدئ/متوسط/متقدم) |
| `/academy/student/courses/[id]` | تفاصيل الدورة + قائمة الدروس + زر «طلب انضمام» |
| `/academy/student/courses` | «دوراتي»: الدورات المسجل بها + نسبة الإكمال |
| `/academy/student/courses/[id]/lessons/[lessonId]` | صفحة الدرس (فيديو/صوت + مواد + وصف + مرفقات PDF + تحديث نسبة التقدم) |
| `/academy/student/tasks` | المهام المطلوبة مع الـ deadlines |
| `/academy/student/tasks/[id]` | تفاصيل المهمة (الوصف وتاريخ التسليم) |
| `/academy/student/tasks/[id]/submit` | رفع ملف أو تسجيل صوتي للتسليم |
| `/academy/student/memorization` | سجل الحفظ والتقدم (آيات يومية، عرض إجمالي من 6236 آية + من 30 جزء) |
| `/academy/student/memorization/goal` | تأكيد إتمام أهداف الحفظ الأسبوعية |
| `/academy/student/sessions` | الجلسات الحية والتسجيلات |
| `/academy/student/sessions/[id]` | تفاصيل الجلسة |
| `/academy/student/path` | المسار التعليمي + التقدم |
| `/academy/student/progress` | إحصائيات + رسوم بيانية أسبوعية وشهرية للحفظ والمراجعة |
| `/academy/student/leaderboard` | ترتيب الطلاب بالنقاط + فلتر «على مستوى الحلقة» / «المنصة كاملة» |
| `/academy/student/badges` | الشارات المكتسبة + المتبقية + شروط الحصول + نسب التقدم |
| `/academy/student/calendar` | تقويم بمواعيد الجلسات والدروس والمهام والـ deadlines + list view على الموبايل + زر «انضمام للجلسة» إذا اليوم |
| `/academy/student/enrollment-requests` | حالة طلبات الانضمام للدورات |
| `/academy/student/certificates` | الشهادات + تحميل PDF + ملء بيانات الإصدار |
| `/academy/student/chat` | المحادثات مع الأساتذة + بحث بالاسم |
| `/academy/student/fiqh` | إرسال الأسئلة الفقهية + عرض الأسئلة المُجابة |
| `/academy/student/fiqh/[id]` | تفاصيل سؤال + الإجابة |
| `/academy/student/forum` | الفئات والموضوعات + إنشاء موضوع جديد |
| `/academy/student/notifications` | إشعارات (قبول/رفض دورات، مهام جديدة، إلخ) + فلتر «غير مقروءة» |
| `/academy/student/profile` | تعديل البيانات + المنصة المفضلة |
| `/academy/student/parent-requests` | طلبات ربط ولي الأمر + قبول/رفض |
| `/academy/student/competitions` | المسابقات المفتوحة + التواريخ |
| `/academy/student/competitions/[id]` | تفاصيل مسابقة + تسجيل تلاوة للمسابقة |
| `/academy/student/points` | النقاط + سجل كامل للنقاط المكتسبة وأسبابها |
| `/academy/invite/[code]` | الانضمام لدورة عبر كود دعوة |

**خريطة المصحف البصرية:** عرض 604 صفحات أو السور/الأجزاء بثلاثة ألوان (أخضر = محفوظ، أصفر = مراجَع، رمادي = غير محفوظ) — تتحدث تلقائياً بعد قبول التسميع.

### 3.2 — أستاذ الأكاديمية (`/academy/teacher`)

| Route | الوصف |
|-------|-------|
| `/academy/teacher` | لوحة تحكم: إحصائيات (الدورات، الطلاب، المهام المنتظرة، الجلسات) |
| `/academy/teacher/courses` | قائمة الدورات |
| `/academy/teacher/courses/new` | إنشاء دورة جديدة (الاسم + التصنيف + المستوى) |
| `/academy/teacher/courses/[id]` | تعديل بيانات الدورة |
| `/academy/teacher/courses/[id]/lessons` | إدارة الدروس مع Drag & Drop للترتيب + رفع فيديو/PDF |
| `/academy/teacher/tasks` | قائمة المهام وتسليمات الطلاب + حذف المهام |
| `/academy/teacher/tasks/new` | إنشاء مهمة جديدة (لطالب فردي أو لمجموعة) |
| `/academy/teacher/tasks/[id]` | تفاصيل المهمة + حالة كل طالب (من أنهى / من لم ينهِ) |
| `/academy/teacher/tasks/[id]/edit` | تعديل بيانات المهمة (الوصف + تاريخ التسليم) |
| `/academy/teacher/tasks/[id]/grade` | إضافة درجة وملاحظة للتسليم |
| `/academy/teacher/schedule` | إدارة المواعيد + جدولة جلسة |
| `/academy/teacher/students` | الطلاب + نسبة التقدم |
| `/academy/teacher/students/create` و `/academy/teacher/students/new` | إنشاء حساب طالب يدوياً |
| `/academy/teacher/sessions` | الجلسات وروابطها + تعديل/حذف |
| `/academy/teacher/live` | بدء جلسة فيديو مباشرة (تكامل مع روابط Zoom/Google Meet) |
| `/academy/teacher/recordings` | تسجيلات الجلسات السابقة |
| `/academy/teacher/halaqat` | الحلقات التي يديرها |
| `/academy/teacher/enrollment-requests` | طلبات الانضمام + قبول/رفض |
| `/academy/teacher/invitations` | إنشاء كود دعوة (مثل `ITQ-FIQH-2026-A1`) |
| `/academy/teacher/chat` | المحادثات مع الطلاب مرتبة بآخر رسالة + بحث بالاسم |
| `/academy/teacher/notifications` | الإشعارات |
| `/academy/teacher/profile` | الملف + حقول التخصص والمؤهلات |
| `/academy/teacher/forum` | نشر مقالات |
| `/academy/teacher/memorization` | متابعة تقدم حفظ جميع الطلاب |
| `/academy/teacher/memorization-goals` | تحديد أهداف حفظ أسبوعية لكل طالب (آيات/صفحات) + متابعة الإنجاز |
| `/academy/teacher/parent-messages` | رسائل من أولياء الأمور |

**سير العمل:** الدرس المرفوع يذهب إلى «انتظار مراجعة المشرف» قبل النشر.

### 3.3 — أدمن الأكاديمية (`/academy/admin`)

| Route | الوصف |
|-------|-------|
| `/academy/admin` | لوحة تحكم: إحصائيات (الطلاب، الأساتذة، الدورات، الالتحاقات) |
| `/academy/admin/courses` | إدارة كل الدورات + تعيين مدرس مخصص |
| `/academy/admin/categories` | إضافة/تعديل/حذف تصنيفات الدورات |
| `/academy/admin/teachers` | قائمة الأساتذة |
| `/academy/admin/teacher-applications` | طلبات انضمام الأساتذة + قبول/رفض مع سبب |
| `/academy/admin/students` | طلاب الأكاديمية |
| `/academy/admin/paths` و `/academy/admin/learning-paths` | إنشاء وإدارة المسارات التعليمية + تعيين مسؤول لمسار فقهي |
| `/academy/admin/access-control` | إدارة الصلاحيات + تغيير `has_academy_access` + سجل «من غيّر ومتى» |
| `/academy/admin/invitations` | إرسال دعوة + تتبعها |
| `/academy/admin/competitions` | إنشاء وإدارة المسابقات + تحديد المشاركين + إدارة الملفات المطلوبة |
| `/academy/admin/leaderboard` | إدارة النقاط والترتيب + سجل كيف اكتسب الطلاب نقاطهم |
| `/academy/admin/badges` | إنشاء وإدارة الشارات + رفع صور مخصصة + تعديل الشروط + منح يدوي |
| `/academy/admin/forum` | إدارة المنتدى والإشراف + إنشاء منتديات |
| `/academy/admin/fiqh` | مراجعة كل الأسئلة والإجابات |
| `/academy/admin/fiqh/officers` | تعيين مشرفي/مسؤولي الفقه (دائم لكل الأسئلة، أو لتصنيف، أو لسؤال محدد) |
| `/academy/admin/announcements` | نشر الإعلانات |
| `/academy/admin/reports` | تقارير الالتحاقات والإكمال والأساتذة + Export (CSV / PDF) |
| `/academy/admin/analytics` | رسوم بيانية تفاعلية + تصدير التحليلات |
| `/academy/admin/halaqat` | إنشاء حلقة (اسم + جنس + أستاذ + توقيت + تصنيف) + إدارة الطلاب وتتبع الحضور |
| `/academy/admin/settings` | إعدادات الأكاديمية (التسجيل، الموافقة، المنتدى) |
| `/academy/admin/points` | إدارة قيم النقاط لكل حدث + حدود المستويات |

### 3.4 — ولي الأمر (`/academy/parent`)

| Route | الوصف |
|-------|-------|
| `/academy/parent` | لوحة تحكم: ملخص أداء كل الأبناء المربوطين + تنبيهات (مهام متأخرة، غياب) |
| `/academy/parent/link-child` | إدخال إيميل ابن + اختيار نوع العلاقة (أب/أم/ولي) + إرسال طلب ربط |
| `/academy/parent/children` | كل الأبناء + الدورات النشطة + نسبة التقدم + إزالة الربط |
| `/academy/parent/reports` | اختيار ابن + فترة زمنية + عرض التقرير (حضور، مهام، درجات) + تصدير PDF |
| `/academy/parent/progress` | رسوم بيانية لنسب الإكمال + شارات الابن + المستوى والنقاط + الجلسات الحاضرة/الغائبة + مقارنة بين الأبناء |
| `/academy/parent/notifications` | إشعارات أداء الأبناء |
| `/academy/parent/reader-messages` | محادثة مع الشيخ بشكل ثنائي |
| `/academy/parent/restrictions` | تحديد السور/المسارات المسموح بها للابن (locked / مخفية في واجهة الابن) |
| `/academy/parent/profile` | تعديل البيانات |

### 3.5 — المشرفون (`/academy/supervisor`)

#### مشرف المحتوى
| Route | الوصف |
|-------|-------|
| `/academy/supervisor/content` | الدروس المنتظرة بحالات (بانتظار المراجعة / مقبول / مرفوض) + قبول/رفض + كتابة سبب |
| `/academy/supervisor/forum` | كل الموضوعات والردود + إخفاء/حذف ردود مخالفة + سجل المخالفات لكل مستخدم |

#### مشرف الفقه (Fiqh Supervisor)
| Route | الوصف |
|-------|-------|
| `/academy/fiqh-supervisor` | الأسئلة بحالات (جديد / قيد المراجعة / مُجاب / مرفوض) |
| `/academy/fiqh-supervisor/questions` | قائمة الأسئلة المعلقة + كتابة إجابة (rich text editor) + النشر |
| `/academy/fiqh-supervisor/messages` | نظام مراسلة |

#### مراقب الجودة
| Route | الوصف |
|-------|-------|
| `/academy/supervisor/quality` | إحصائيات الجودة (متوسط درجات الأساتذة، وقت التقييم، الشكاوى) + عرض التقييمات (قراءة فقط) + كتابة تقرير وإرساله للأدمن |

---

## 4. الميزات المستعرضة (Cross-cutting Features)

### 4.1 — نظام النقاط
- تسجيل تلاوة: **+10**
- تلاوة مقبولة بـ«إتقان»: **+30**
- إنهاء مهمة: **+15**
- حضور درس: **+20**
- يوم Streak جديد: **+5**
- إنهاء جزء كامل: **+100**
- مضاعفة ×1.5 عند Streak ≥ 7 أيام
- سجل النقاط بسبب كل عملية

### 4.2 — نظام المستويات
- مبتدئ: 0–500 نقطة
- متوسط: 500–2000
- متقدم: 2000–5000
- حافظ: 5000+
- ترقية تلقائية + إشعار + فتح مزايا إضافية

### 4.3 — عداد الـ Streak
- يزيد بتسجيل تلاوة كل يوم
- يصفر بفقدان يوم
- إشعار قرب نهاية اليوم لو لم يسجّل (cron)

### 4.4 — الشارات
- شارات تلقائية: «أول تلاوة» (+20)، «أسبوع كامل» Streak 7 (+70)، «حافظ جزء عم» (+200)، «مئة تلاوة» (+150)، «متقن التجويد» (+300)، «شهر رمضان» (+250)، «الختمة الكاملة» (+1000)، «نجم الحلقة» (+180)
- نظام تتبع التقدم (مثلاً 67/100)
- تظهر في لوحة ولي الأمر

### 4.5 — المسارات التعليمية
- **مسارات القرآن:** حفظ القرآن (مرتب من جزء عم للختمة)، التجويد (مراحل متسلسلة، تفتح فقط بعد اجتياز السابقة بتقييم المقرئ)
- **مسارات العلوم الشرعية:** الفقه، العقيدة، السيرة، التفسير
- مرحلة مقفولة تظهر `locked` بوضوح

### 4.6 — المسابقات
- مسابقة التلاوة الشهرية
- مسابقة رمضان (تتبع الآيات المحفوظة شهرياً)
- مسابقة التجويد (تحديد الأحكام المطلوبة)
- إعلان فائز + شارة + نقاط مضاعفة

### 4.7 — لوحة المتصدرين (Leaderboard)
- ترتيب حسب النقاط + فلتر (الحلقة / المنصة كاملة)
- تحديث ترتيب لحظي + Animation

### 4.8 — الفيديو كول المدمج
- إنشاء جلسة + إضافة رابط Zoom/Google Meet
- إرسال لطالب واحد أو مجموعة
- تنتهي الصلاحية بعد انتهاء الجلسة
- ربط بإعلانات الجلسات

### 4.9 — إحصائيات الأداء
- رسوم بيانية لنسب الإكمال الأسبوعية والشهرية
- معدل النشاط + أكثر الدورات اشتراكاً
- تصدير CSV / PDF

---

## 5. الـ APIs الرئيسية

### Auth & Access
- `/api/academy/admin/access-control`
- `/api/academy/admin/points`
- `/api/academy/student/points`

### الطالب
- `/api/academy/student/calendar`
- `/api/academy/student/memorization` (GET + POST)
- `/api/academy/student/stats`
- `/api/academy/student/badges`
- `/api/academy/student/parent-requests`
- `/api/academy/student/competitions`

### الأستاذ
- `/api/academy/teacher/memorization-goals` (GET + POST)
- `/api/academy/teacher/live-session` (POST + PATCH)
- `/api/academy/teacher/sessions` (GET + POST + PATCH + DELETE)

### الأدمن
- `/api/academy/admin/announcements`
- `/api/academy/admin/analytics`
- `/api/academy/admin/stats`
- `/api/academy/admin/badges` (GET + POST)
- `/api/academy/admin/badges/[id]` (PATCH + DELETE)
- `/api/academy/admin/badges/[badge_type]`
- `/api/academy/admin/competitions/[id]` (GET + PATCH + DELETE)

### ولي الأمر
- `/api/academy/parent/link-child`
- `/api/academy/parent/children`
- `/api/academy/parent/progress`
- `/api/academy/parent/reports`
- `/api/academy/parent/restrictions`
- `/api/academy/parent/reader-conversations`

### الفقه
- `/api/academy/fiqh` (GET + POST)
- `/api/academy/fiqh/[id]` (GET + PATCH)
- `/api/academy/fiqh/categories`

### المنتدى
- `/api/academy/forum` (GET + POST)
- `/api/academy/forum/[id]` (GET + PATCH + DELETE)
- `/api/community/articles`

### الشات
- `/api/conversations`
- `/api/unread-counts`

### الشهادات
- `/api/certificate`
- `/api/certificate-pdf`

### Leaderboard
- `/api/academy/leaderboard`

---

## 6. الإشعارات والـ Cron Jobs

### القنوات
- داخل المنصة (Bell)
- البريد الإلكتروني (SMTP)

### مناسبات الإشعارات
- قبول/رفض طلب أستاذ
- وصول طلب انضمام لدورة (للأستاذ)
- قبول/رفض الانضمام (للطالب)
- وصول مهمة جديدة + تقييم مهمة
- وصول رابط جلسة + تذكير قبل ساعة + تذكير قبل 10 دقائق
- وصول رد في موضوع للمنشئ
- ترقية مستوى
- شارة جديدة
- تحذير الـ Streak قرب نهاية اليوم
- طلب ربط ولي أمر (للابن) + نتيجة التأكيد (لولي الأمر)
- جواب الفقه + رفض السؤال مع سبب

### Cron Jobs
- `/api/cron/session-reminders` — تذكيرات الجلسات
- `/api/cron/task-reminders` — تذكيرات المهام (تذكير صباحي يومي + تنبيه مهام متأخرة)
- `/api/cron/streak-reminders` — تذكيرات الـ Streak
- `/api/cron/parent-weekly-reports` — تقارير ولي الأمر الأسبوعية (تلاوات الأسبوع، الجلسات، المستوى، الشارات الجديدة)
- `/api/cron/admin-activity-reports` — تقارير الإدارة الأسبوعية والشهرية
- `/api/cron/academy-reminders` — تذكيرات الأكاديمية العامة
- `/api/cron/check-expirations` — فحص الانتهاءات

---

## 7. المتطلبات العامة

### نظام الألوان والهوية
- الأكاديمية: أزرق `#1E3A5F` ومشتقاته
- تمييز بصري واضح للعلامة التجارية

### Dark Mode
- على كل صفحات الأكاديمية
- لا توجد عناصر/نصوص غير مقروءة

### Responsive Design
- صفحة الدرس (فيديو) على الموبايل
- شات الأكاديمية على الموبايل
- التقويم يتحول إلى list view
- صفحة تسليم المهام
- كل القوائم تشتغل على الشاشات الصغيرة

### Animations
- Mode Switcher: fade + slide
- Progress bar في الدورة: animated
- Pulse animation على badge الإشعارات الجديدة
- Step indicator عند الانضمام لدورة
- Animation لتغيير الترتيب في Leaderboard

### الأمان والصلاحيات
- كل API routes محمية بالـ authentication و authorization
- ولي الأمر لا يقدر يصل لبيانات طالب غير مربوط به
- الطالب/الأستاذ لا يقدران دخول لوحة الأدمن
- الأستاذ لا يقدر يدخل `/academy/admin` ولا `/student` ولا `/reader`

### الأداء والاستقرار
- كل الصفحات مربوطة بـ DB / Backend (لا توجد mock data)
- زمن تحميل أقل من 3 ثوانٍ
- لا توجد memory leaks أو طلبات API متكررة

---

**آخر تحديث:** 27 مايو 2026
