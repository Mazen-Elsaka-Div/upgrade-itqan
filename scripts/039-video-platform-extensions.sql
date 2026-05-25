-- Migration: video platform extensions
-- Adds:
--   * video_session_pending_joins  (waiting-room queue when
--     video_settings.require_approval_to_join is on)
--   * video_recordings             (client-side multipart S3 recordings)
--   * video_recording_parts        (per-chunk multipart progress for crash
--                                   recovery)
--   * extra index on video_session_participants(left_at)
--   * extra index on video_sessions(room_name, ended_at)

BEGIN;

CREATE TABLE IF NOT EXISTS video_session_pending_joins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind VARCHAR(32) NOT NULL CHECK (kind IN ('halaqa', 'booking', 'course_session')),
  ref_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(16) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'denied')),
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (kind, ref_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_video_pending_joins_lookup
  ON video_session_pending_joins(kind, ref_id, status);

CREATE INDEX IF NOT EXISTS idx_video_participants_left_at
  ON video_session_participants(left_at);

CREATE INDEX IF NOT EXISTS idx_video_sessions_room_ended
  ON video_sessions(room_name, ended_at);

-- Client-side recording (multipart S3) ---------------------------------------

CREATE TABLE IF NOT EXISTS video_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES video_sessions(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  source VARCHAR(16) NOT NULL DEFAULT 'client'
    CHECK (source IN ('client', 'egress')),
  s3_bucket TEXT,
  s3_key TEXT NOT NULL,
  s3_region TEXT,
  upload_id TEXT,
  mime_type TEXT NOT NULL DEFAULT 'video/webm',
  status VARCHAR(16) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'uploading', 'completed', 'failed', 'aborted')),
  bytes_uploaded BIGINT NOT NULL DEFAULT 0,
  parts_count INT NOT NULL DEFAULT 0,
  duration_seconds INT,
  recording_url TEXT,
  last_part_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_video_recordings_session ON video_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_video_recordings_status_last_part
  ON video_recordings(status, last_part_at);

CREATE TABLE IF NOT EXISTS video_recording_parts (
  id BIGSERIAL PRIMARY KEY,
  recording_id UUID NOT NULL REFERENCES video_recordings(id) ON DELETE CASCADE,
  part_number INT NOT NULL,
  etag TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (recording_id, part_number)
);

CREATE INDEX IF NOT EXISTS idx_video_recording_parts_rec ON video_recording_parts(recording_id, part_number);

COMMIT;
