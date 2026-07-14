-- ==========================================
-- MIGRATION 067: Settings Ownership Split
-- ============================ ============
-- Separates SYSTEM (super admin) settings from PLATFORM-SPECIFIC (academy/maqraah) settings
-- Eliminates duplicate keys and consolidates SMTP configuration
-- Run AFTER: 066-* (if exists)
-- Run BEFORE: Any backend code that uses new keys
-- ==========================================

-- ============================================
-- STEP 1: BACKUP CURRENT STATE (FOR SAFETY)
-- ============================================
-- Create a backup table before any modifications
CREATE TABLE IF NOT EXISTS system_settings_backup_067 AS
SELECT * FROM system_settings;

-- Add a migration marker
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, updated_at)
VALUES (
  'migration_067_executed_at',
  NOW()::text,
  'system_migration',
  'Timestamp of migration 067 execution for audit trail',
  NOW()
)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = NOW()::text,
  updated_at = NOW();

-- ============================================
-- STEP 2: IDENTIFY CURRENT KEYS (SANITY CHECK)
-- ============================================
-- Count keys by category before migration
-- academy_* = SHOULD BE MOVED TO system_*
-- maqraah_* = STAYS IN maqraah_*
-- (queries below for reference, not executed)

-- SELECT setting_key, COUNT(*) FROM system_settings
-- WHERE setting_type IN ('academy_general', 'academy_security', 'academy_maintenance')
-- GROUP BY setting_key;

-- ============================================
-- STEP 3: CONSOLIDATE SYSTEM SETTINGS
-- ============================================
-- These are SITE-WIDE settings managed by Super Admin
-- They are GENERAL settings, NOT academy or maqraah specific

-- 3.1: GENERAL / SITE INFO → system_general_*
UPDATE system_settings 
SET 
  setting_key = CASE 
    WHEN setting_key = 'site_name' THEN 'system_general_site_name'
    WHEN setting_key = 'site_tagline' THEN 'system_general_site_tagline'
    WHEN setting_key = 'site_contact_email' THEN 'system_general_contact_email'
    WHEN setting_key = 'site_contact_phone' THEN 'system_general_contact_phone'
    WHEN setting_key = 'site_timezone' THEN 'system_general_timezone'
    WHEN setting_key = 'site_default_language' THEN 'system_general_language'
    WHEN setting_key = 'site_info' THEN 'system_general_site_info'
    WHEN setting_key = 'site_social_links' THEN 'system_general_social_links'
    ELSE setting_key
  END,
  setting_type = CASE
    WHEN setting_key IN ('site_name', 'site_tagline', 'site_contact_email', 'site_contact_phone', 'site_timezone', 'site_default_language', 'site_info', 'site_social_links')
    THEN 'system_general'
    ELSE setting_type
  END
WHERE setting_key IN ('site_name', 'site_tagline', 'site_contact_email', 'site_contact_phone', 'site_timezone', 'site_default_language', 'site_info', 'site_social_links');

-- 3.2: MAINTENANCE → system_maintenance_*
UPDATE system_settings
SET
  setting_key = CASE
    WHEN setting_key = 'site_maintenance_enabled' THEN 'system_maintenance_enabled'
    WHEN setting_key = 'site_maintenance_message' THEN 'system_maintenance_message'
    WHEN setting_key = 'maintenance_mode' THEN 'system_maintenance_enabled'
    WHEN setting_key = 'maintenance_message' THEN 'system_maintenance_message'
    ELSE setting_key
  END,
  setting_type = CASE
    WHEN setting_key IN ('site_maintenance_enabled', 'site_maintenance_message', 'maintenance_mode', 'maintenance_message')
    THEN 'system_maintenance'
    ELSE setting_type
  END
WHERE setting_key IN ('site_maintenance_enabled', 'site_maintenance_message', 'maintenance_mode', 'maintenance_message');

-- 3.3: SECURITY → system_security_*
UPDATE system_settings
SET
  setting_key = CASE
    WHEN setting_key = 'activity_logging' THEN 'system_security_activity_logging'
    WHEN setting_key = 'limit_login_attempts' THEN 'system_security_limit_login_attempts'
    WHEN setting_key = 'security_settings' THEN 'system_security_settings'
    ELSE setting_key
  END,
  setting_type = CASE
    WHEN setting_key IN ('activity_logging', 'limit_login_attempts', 'security_settings')
    THEN 'system_security'
    ELSE setting_type
  END
WHERE setting_key IN ('activity_logging', 'limit_login_attempts', 'security_settings');

-- 3.4: BRANDING → system_branding_*
UPDATE system_settings
SET
  setting_key = CASE
    WHEN setting_key = 'branding' THEN 'system_branding_assets'
    ELSE setting_key
  END,
  setting_type = CASE
    WHEN setting_key = 'branding' THEN 'system_branding'
    ELSE setting_type
  END
WHERE setting_key = 'branding';

-- 3.5: CONTACT INFO → system_contact_*
UPDATE system_settings
SET
  setting_key = CASE
    WHEN setting_key = 'contact_info' THEN 'system_contact_info'
    ELSE setting_key
  END,
  setting_type = CASE
    WHEN setting_key = 'contact_info' THEN 'system_contact'
    ELSE setting_type
  END
WHERE setting_key = 'contact_info';

-- ============================================
-- STEP 4: CONSOLIDATE SMTP (SINGLE SOURCE)
-- ============================================
-- SMTP is shared across all platforms, managed by Super Admin only
-- Keep only ONE version: system_email_smtp_config

DELETE FROM system_settings
WHERE setting_key IN ('smtp_user', 'smtp_pass', 'smtp_host', 'smtp_port', 'smtp_tls')
AND setting_type = 'email';

-- Consolidate the main SMTP config
UPDATE system_settings
SET
  setting_key = 'system_email_smtp_config',
  setting_type = 'system_email'
WHERE setting_key = 'smtp_config' AND setting_type = 'email';

-- ============================================
-- STEP 5: REMOVE ACADEMY-SPECIFIC DUPLICATES
-- ============================================
-- The Academy shares system-wide settings (general, security, maintenance, email)
-- Do NOT delete academy_* keys yet — we'll keep them for reference during gradual rollout
-- Just mark them as deprecated and point to system_* equivalents

UPDATE system_settings
SET description = 'DEPRECATED: Use system_* equivalent. Kept for backward compatibility only.'
WHERE setting_type IN ('academy_general', 'academy_security', 'academy_maintenance')
AND setting_key IN (
  'academy_general_name',
  'academy_general_logo',
  'academy_general_favicon',
  'academy_general_description',
  'academy_general_contact_email',
  'academy_general_whatsapp',
  'academy_general_timezone',
  'academy_general_language',
  'academy_general_direction',
  'academy_security_session_timeout',
  'academy_security_max_login_attempts',
  'academy_security_lock_duration',
  'academy_security_password_policy',
  'academy_security_admin_2fa',
  'academy_security_admin_ip_whitelist',
  'academy_security_activity_logs_enabled',
  'academy_security_api_rate_limit',
  'academy_security_daily_upload_limit_mb',
  'academy_maintenance_enabled',
  'academy_maintenance_message',
  'academy_maintenance_allowed_ips'
);

-- ============================================
-- STEP 6: KEEP ACADEMY-SPECIFIC SETTINGS
-- ============================================
-- These are features of the Academy module and must stay
-- (courses, registration, sessions, gamification, forum, notifications about academy)

-- No changes needed — they are correctly namespaced as academy_*

-- ============================================
-- STEP 7: KEEP MAQRAAH-SPECIFIC SETTINGS
-- ============================================
-- These are features of the Maqraah module
-- (halaqat, readers, recitations, paths, points, competitions, notifications about maqraah)

-- No changes needed — they are correctly namespaced as maqraah_*

-- ============================================
-- STEP 8: HOMEPAGE SETTINGS → system_homepage_*
-- ============================================
UPDATE system_settings
SET
  setting_type = 'system_homepage'
WHERE setting_type = 'homepage';

-- ============================================
-- STEP 9: REMOVE DUPLICATE/OBSOLETE KEYS
-- ============================================
-- These are old, unused keys that don't fit the new scheme

DELETE FROM system_settings
WHERE setting_key IN (
  'platform_name',
  'surah_name',
  'app_url', -- moved to system_general
  'default_session_duration',
  'max_daily_sessions_per_reader',
  'max_sessions_per_reader_daily',
  'max_file_size_mb',
  'reader_assignment_strategy',
  'reader_attachment_required',
  'reader_certificate_field_visible',
  'reader_certificate_required',
  'reader_experience_field_visible',
  'recording_max_seconds',
  'resend_email_on_result_change',
  'resend_email_on_result_update',
  'session_duration_minutes',
  'show_certificate_section',
  'show_qualification_field',
  'show_years_of_experience',
  'certificate_data_required',
  'certificate_mandatory_for_mastered',
  'certificate_pdf_required',
  'certificate_section_enabled',
  'global_ceremony_date',
  'booking_settings'
);

-- ============================================
-- STEP 10: ADD NEW SYSTEM SETTINGS
-- ============================================
-- If these don't exist, add them

INSERT INTO system_settings (setting_key, setting_value, setting_type, description, updated_at)
VALUES (
  'system_general_app_url',
  NULL,
  'system_general',
  'Application base URL for links and redirects',
  NOW()
)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, description, updated_at)
VALUES (
  'system_security_activity_logging_enabled',
  true,
  'system_security',
  'Enable audit trail logging for admin actions',
  NOW()
)
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- STEP 11: VERIFY MIGRATION
-- ============================================
-- Count final keys by type
-- SELECT setting_type, COUNT(*) as count FROM system_settings GROUP BY setting_type ORDER BY count DESC;

-- Show all system_* keys (should be comprehensive now)
-- SELECT setting_key, setting_type FROM system_settings WHERE setting_type LIKE 'system_%' ORDER BY setting_key;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Next steps:
-- 1. Update API routes to use system_* keys
-- 2. Update lib/settings.ts to use system_* keys
-- 3. Update hooks to use system_* keys
-- 4. Create new Maqraah admin settings page
-- 5. Update dashboard navigation
-- 6. Test with all 3 admin roles
-- 7. Optional: Delete deprecated academy_general/security/maintenance keys after verification
