-- ============================================
-- 053 - Competition Judges (safety / idempotent)
-- ============================================
-- The competition_judges junction table was introduced in migration
-- 027-competitions-system.sql. This file re-creates it defensively so the new
-- "assign teacher/reciter as judge" admin feature works even if 027 was never
-- run against the live database. Safe to run multiple times.
-- ============================================

CREATE TABLE IF NOT EXISTS competition_judges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(competition_id, judge_id)
);

CREATE INDEX IF NOT EXISTS idx_competition_judges_competition ON competition_judges(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_judges_judge ON competition_judges(judge_id);
