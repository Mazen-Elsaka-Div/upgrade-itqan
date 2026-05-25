-- ============================================
-- 038: Video calling platform — unified live
--      sessions, participants, ratings, settings.
-- ============================================
-- Builds on top of migration 037 (halaqat_live_sessions).
-- Adds:
--   * a unified "video_sessions" table that backs *any* kind
--     of LiveKit-powered session (halaqat, bookings, course
--     sessions) so we have a single log + recording surface
--   * video_session_participants for attendance/audit
--   * video_session_ratings (1-5 stars + optional comment)
--   * video_settings per platform (academy vs maqra'a)
-- ============================================

-- Add LiveKit room columns to bookings + course_sessions so we
-- can use the same room-name convention everywhere.
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS livekit_room_name VARCHAR(128);

ALTER TABLE course_sessions
  ADD COLUMN IF NOT EXISTS livekit_room_name VARCHAR(128);

-- ============================================
-- 1. video_sessions
-- ============================================
-- Polymorphic: the (kind, ref_id) pair points at the source
-- entity (a halaqa, booking, or course_session). One row per
-- live meeting; ended_at IS NULL means it's currently live.
CREATE TABLE IF NOT EXISTS video_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind VARCHAR(20) NOT NULL,
  ref_id UUID NOT NULL,
  platform VARCHAR(16) NOT NULL,
  room_name VARCHAR(128) NOT NULL,
  started_by UUID REFERENCES users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  -- LiveKit egress (recording) metadata
  egress_id VARCHAR(128),
  recording_status VARCHAR(20) DEFAULT 'disabled',
  recording_url TEXT,
  -- denormalised metrics
  peak_participants INTEGER NOT NULL DEFAULT 0,
  total_participants INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE video_sessions
  DROP CONSTRAINT IF EXISTS video_sessions_kind_check;
ALTER TABLE video_sessions
  ADD CONSTRAINT video_sessions_kind_check
  CHECK (kind IN ('halaqa', 'booking', 'course_session'));

ALTER TABLE video_sessions
  DROP CONSTRAINT IF EXISTS video_sessions_platform_check;
ALTER TABLE video_sessions
  ADD CONSTRAINT video_sessions_platform_check
  CHECK (platform IN ('academy', 'maqraa'));

ALTER TABLE video_sessions
  DROP CONSTRAINT IF EXISTS video_sessions_recording_status_check;
ALTER TABLE video_sessions
  ADD CONSTRAINT video_sessions_recording_status_check
  CHECK (recording_status IN ('disabled', 'pending', 'recording', 'completed', 'failed'));

CREATE INDEX IF NOT EXISTS idx_video_sessions_ref ON video_sessions(kind, ref_id);
CREATE INDEX IF NOT EXISTS idx_video_sessions_platform ON video_sessions(platform);
CREATE INDEX IF NOT EXISTS idx_video_sessions_started_at ON video_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_video_sessions_active
  ON video_sessions(platform, kind, ref_id) WHERE ended_at IS NULL;

-- ============================================
-- 2. video_session_participants
-- ============================================
-- One row per join event (a user can have multiple if they
-- disconnect and rejoin). joined_at <= left_at.
CREATE TABLE IF NOT EXISTS video_session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES video_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(16) NOT NULL DEFAULT 'participant',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  device_info JSONB
);

ALTER TABLE video_session_participants
  DROP CONSTRAINT IF EXISTS video_session_participants_role_check;
ALTER TABLE video_session_participants
  ADD CONSTRAINT video_session_participants_role_check
  CHECK (role IN ('host', 'participant', 'viewer'));

CREATE INDEX IF NOT EXISTS idx_vsp_session ON video_session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_vsp_user ON video_session_participants(user_id);

-- ============================================
-- 3. video_session_ratings
-- ============================================
CREATE TABLE IF NOT EXISTS video_session_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES video_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  comment TEXT,
  audio_quality INTEGER,
  video_quality INTEGER,
  teacher_rating INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, user_id)
);

ALTER TABLE video_session_ratings
  DROP CONSTRAINT IF EXISTS video_session_ratings_rating_check;
ALTER TABLE video_session_ratings
  ADD CONSTRAINT video_session_ratings_rating_check
  CHECK (rating BETWEEN 1 AND 5);

CREATE INDEX IF NOT EXISTS idx_vsr_session ON video_session_ratings(session_id);
CREATE INDEX IF NOT EXISTS idx_vsr_user ON video_session_ratings(user_id);

-- ============================================
-- 4. video_settings (per platform)
-- ============================================
CREATE TABLE IF NOT EXISTS video_settings (
  platform VARCHAR(16) PRIMARY KEY,
  max_participants INTEGER NOT NULL DEFAULT 50,
  default_video_quality VARCHAR(16) NOT NULL DEFAULT 'h720',
  default_audio_only BOOLEAN NOT NULL DEFAULT FALSE,
  -- Recording
  recording_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  recording_auto_start BOOLEAN NOT NULL DEFAULT FALSE,
  recording_storage_url TEXT,
  -- Permissions
  allow_chat BOOLEAN NOT NULL DEFAULT TRUE,
  allow_screen_share BOOLEAN NOT NULL DEFAULT TRUE,
  allow_student_unmute BOOLEAN NOT NULL DEFAULT TRUE,
  allow_student_video BOOLEAN NOT NULL DEFAULT TRUE,
  require_approval_to_join BOOLEAN NOT NULL DEFAULT FALSE,
  -- Limits
  max_duration_minutes INTEGER NOT NULL DEFAULT 180,
  inactivity_timeout_minutes INTEGER NOT NULL DEFAULT 15,
  -- UX
  show_participant_count BOOLEAN NOT NULL DEFAULT TRUE,
  enable_post_session_rating BOOLEAN NOT NULL DEFAULT TRUE,
  watermark_text VARCHAR(120),
  -- Bookkeeping
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE video_settings
  DROP CONSTRAINT IF EXISTS video_settings_platform_check;
ALTER TABLE video_settings
  ADD CONSTRAINT video_settings_platform_check
  CHECK (platform IN ('academy', 'maqraa'));

ALTER TABLE video_settings
  DROP CONSTRAINT IF EXISTS video_settings_video_quality_check;
ALTER TABLE video_settings
  ADD CONSTRAINT video_settings_video_quality_check
  CHECK (default_video_quality IN ('h180', 'h360', 'h540', 'h720', 'h1080'));

-- Seed defaults for both platforms (idempotent).
INSERT INTO video_settings (platform) VALUES ('academy')
  ON CONFLICT (platform) DO NOTHING;
INSERT INTO video_settings (platform) VALUES ('maqraa')
  ON CONFLICT (platform) DO NOTHING;

-- ============================================
-- 5. Backfill halaqat_live_sessions into video_sessions
-- ============================================
INSERT INTO video_sessions (
  id, kind, ref_id, platform, room_name, started_by,
  started_at, ended_at, recording_status, peak_participants
)
SELECT
  hls.id,
  'halaqa',
  hls.halaqah_id,
  COALESCE(h.platform, 'academy'),
  hls.livekit_room_name,
  hls.started_by,
  hls.started_at,
  hls.ended_at,
  'disabled',
  hls.participants_count
FROM halaqat_live_sessions hls
LEFT JOIN halaqat h ON h.id = hls.halaqah_id
ON CONFLICT (id) DO NOTHING;
