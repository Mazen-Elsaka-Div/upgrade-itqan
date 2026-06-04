-- ============================================
-- 046: DIAGNOSTIC ONLY (read-only) — لماذا "سجل الجلسات" فارغ؟
-- ============================================
-- استعلام واحد يرجّع كل الأرقام في صف واحد، عشان محرر الـ SQL
-- يعرضها كلها مرة واحدة (بعض المحررات بتعرض نتيجة آخر استعلام فقط).
-- كله SELECT — مفيش أي تعديل على البيانات.
-- ============================================

SELECT
  (SELECT COUNT(*) FROM video_sessions)                                   AS total_video_sessions,
  (SELECT COUNT(*) FROM video_sessions WHERE platform = 'academy')        AS academy_video_sessions,
  (SELECT COUNT(*) FROM video_sessions WHERE platform = 'maqraa')         AS maqraa_video_sessions,
  (SELECT COUNT(*) FROM video_sessions WHERE kind = 'course_session')     AS course_session_rows,
  (SELECT COUNT(*) FROM video_sessions WHERE recording_status = 'recording') AS now_recording,
  (SELECT COUNT(*) FROM video_sessions WHERE egress_id IS NOT NULL)       AS with_egress,
  (SELECT COUNT(*) FROM course_sessions)                                  AS total_course_sessions,
  (SELECT string_agg(DISTINCT platform, ', ') FROM video_sessions)        AS distinct_platforms;

-- لو عايز تشوف آخر الصفوف فعلياً (شغّله لوحده لو محررك بيعرض نتيجة واحدة):
-- SELECT id, kind, platform, room_name, started_by, started_at, ended_at, recording_status, egress_id
-- FROM video_sessions ORDER BY started_at DESC LIMIT 10;
