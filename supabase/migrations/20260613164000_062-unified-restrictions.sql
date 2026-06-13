-- ============================================
-- 062: Unified Restrictions System
-- Consolidates parent_content_restrictions into a cleaner schema
-- with parent_id + child_id columns and adds 'course' + 'feature' types.
-- ============================================

BEGIN;

-- ----------------------------------------
-- 1) Create the new unified parent_content_restrictions table
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS parent_content_restrictions_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restriction_type VARCHAR(50) NOT NULL
    CHECK (restriction_type IN ('course', 'surah', 'feature', 'memorization_path', 'tajweed_path')),
  target_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, child_id, restriction_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_pcr_new_parent_child
  ON parent_content_restrictions_new(parent_id, child_id);
CREATE INDEX IF NOT EXISTS idx_pcr_new_child_type
  ON parent_content_restrictions_new(child_id, restriction_type);

-- ----------------------------------------
-- 2) Migrate existing data from old table (if it exists)
-- ----------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parent_content_restrictions') THEN
    INSERT INTO parent_content_restrictions_new (parent_id, child_id, restriction_type, target_id, created_at)
    SELECT
      pc.parent_id,
      pc.child_id,
      pcr.restriction_type,
      pcr.target_id,
      pcr.created_at
    FROM parent_content_restrictions pcr
    JOIN parent_children pc ON pc.id = pcr.parent_child_id
    WHERE pcr.is_blocked = TRUE
    ON CONFLICT (parent_id, child_id, restriction_type, target_id) DO NOTHING;

    RAISE NOTICE 'Migrated data from parent_content_restrictions to new table';
  ELSE
    RAISE NOTICE 'parent_content_restrictions does not exist — skipping migration';
  END IF;
END $$;

-- ----------------------------------------
-- 3) Drop old table and rename new one
-- ----------------------------------------
DROP TABLE IF EXISTS parent_content_restrictions CASCADE;
ALTER TABLE parent_content_restrictions_new RENAME TO parent_content_restrictions;

-- ----------------------------------------
-- 4) Recreate unique index with the new name
-- ----------------------------------------
DROP INDEX IF EXISTS idx_pcr_new_parent_child;
DROP INDEX IF EXISTS idx_pcr_new_child_type;

CREATE INDEX IF NOT EXISTS idx_pcr_parent_child
  ON parent_content_restrictions(parent_id, child_id);
CREATE INDEX IF NOT EXISTS idx_pcr_child_type
  ON parent_content_restrictions(child_id, restriction_type);

COMMIT;
