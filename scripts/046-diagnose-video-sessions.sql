-- ============================================
-- 046: DIAGNOSTIC ONLY (read-only) — لماذا "سجل الجلسات" فارغ؟
-- ============================================
-- شغّل كل استعلام على الـ live DB وابعتلي النتائج.
-- مفيش أي تعديل على البيانات هنا — كله SELECT.
-- ============================================

-- (1) هل جدول video_sessions موجود وكام صف فيه إجمالاً؟
SELECT COUNT(*) AS total_video_sessions FROM video_sessions;

-- (2) توزيع الصفوف حسب المنصّة والنوع (لو فاضي يبقى مفيش جلسات اتسجّلت أصلاً).
SELECT platform, kind, COUNT(*) AS c
FROM video_sessions
GROUP BY platform, kind
ORDER BY c DESC;

-- (3) آخر 10 جلسات (لو ظهرت صفوف هنا يبقى الإدراج شغّال والمشكلة في الفلترة/العرض).
SELECT id, kind, platform, room_name, started_by,
       started_at, ended_at, recording_status, egress_id
FROM video_sessions
ORDER BY started_at DESC
LIMIT 10;

-- (4) قيم platform الموجودة فعلاً (نكشف أي اختلاف إملائي/مسافات مثل ' academy ').
SELECT DISTINCT platform, length(platform) AS len
FROM video_sessions;

-- (5) تأكيد إن أعمدة الإدراج كلها موجودة في الـ live (لو ناقص عمود الإدراج بيفشل بصمت).
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'video_sessions'
ORDER BY ordinal_position;

-- (6) هل فيه جلسات دورات (course_session) في جدول الدورات تقدر تُبَث؟
SELECT cs.id, cs.title, cs.status, cs.scheduled_at, c.teacher_id
FROM course_sessions cs
JOIN courses c ON c.id = cs.course_id
ORDER BY cs.scheduled_at DESC NULLS LAST
LIMIT 10;
