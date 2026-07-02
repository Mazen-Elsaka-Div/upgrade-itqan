-- ============================================
-- Migration 066: Add super_admin & maqraa_admin to the users.role CHECK
-- These two tiers power the new admin governance model:
--   • super_admin  — full platform control incl. public site, theme, branding, SEO
--   • maqraa_admin — manages the Qur'an / recitation (maqraa) side
-- The legacy `admin` role keeps working and is treated as a super admin in code.
-- ============================================

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN (
    'student',
    'reader',
    'admin',
    'super_admin',
    'maqraa_admin',
    'teacher',
    'academy_admin',
    'parent',
    'student_supervisor',
    'reciter_supervisor',
    'fiqh_supervisor',
    'content_supervisor',
    'supervisor',
    'quality_supervisor'
  ));

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 066: super_admin & maqraa_admin roles allowed';
END $$;
