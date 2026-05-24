-- ============================================================
-- Phase: Fiqh Library polish
--   - Full-text search index (Arabic-friendly via simple config)
--   - Migrate Fiqh Categories to the unified `categories` table
-- ============================================================

BEGIN;

-- ---------------------------------------------------------
-- 1) Make sure all required workflow columns exist
-- ---------------------------------------------------------
ALTER TABLE fiqh_questions
  ADD COLUMN IF NOT EXISTS title VARCHAR(240),
  ADD COLUMN IF NOT EXISTS category_id UUID,
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS publish_consent VARCHAR(16) DEFAULT 'unrequested',
  ADD COLUMN IF NOT EXISTS publish_consent_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS publish_consent_responded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_role VARCHAR(32);

-- ---------------------------------------------------------
-- 2) Helper indexes for the library + inbox queries
-- ---------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_fiqh_questions_status
  ON fiqh_questions(status);
CREATE INDEX IF NOT EXISTS idx_fiqh_questions_assigned
  ON fiqh_questions(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_fiqh_questions_asker_status
  ON fiqh_questions(asked_by, status);
CREATE INDEX IF NOT EXISTS idx_fiqh_questions_published
  ON fiqh_questions(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_fiqh_questions_category_id
  ON fiqh_questions(category_id);
CREATE INDEX IF NOT EXISTS idx_fiqh_questions_category_str
  ON fiqh_questions(category);

-- ---------------------------------------------------------
-- 3) Full-text search GIN index over title/question/answer.
-- ---------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_fiqh_questions_fts
  ON fiqh_questions
  USING GIN (
    to_tsvector(
      'simple',
      COALESCE(title, '') || ' ' ||
      COALESCE(question, '') || ' ' ||
      COALESCE(answer, '')
    )
  );

-- ---------------------------------------------------------
-- 4) Migrate from fiqh_categories to categories
-- ---------------------------------------------------------
-- Drop the old constraints if they exist
ALTER TABLE fiqh_questions DROP CONSTRAINT IF EXISTS fiqh_questions_category_id_fkey;
ALTER TABLE fiqh_officer_categories DROP CONSTRAINT IF EXISTS fiqh_officer_categories_category_id_fkey;

-- Ensure root category "الفقه" exists in categories
INSERT INTO categories (id, name, slug, description, short_description, display_order, is_active)
SELECT
    gen_random_uuid(),
    'الفقه',
    'fiqh',
    'قسم الفقه والأحكام الشرعية',
    'تصنيف رئيسي لأسئلة الفقه',
    10,
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM categories WHERE slug = 'fiqh'
);

-- Seed the 5 sub-categories under "الفقه"
WITH root AS (SELECT id FROM categories WHERE slug = 'fiqh' LIMIT 1)
INSERT INTO categories (id, name, slug, parent_id, display_order, is_active)
SELECT gen_random_uuid(), v.name, v.slug, (SELECT id FROM root), v.ord, TRUE
FROM (
    VALUES
        ('الطهارة',      'tahara',     1),
        ('الصلاة',       'salah',      2),
        ('الصيام',       'sawm',       3),
        ('الزكاة',       'zakah',      4),
        ('الحج والعمرة', 'hajj-umrah', 5)
) AS v(name, slug, ord)
WHERE NOT EXISTS (
    SELECT 1 FROM categories c WHERE c.slug = v.slug
);

-- Point foreign keys to categories
ALTER TABLE fiqh_questions
  ADD CONSTRAINT fiqh_questions_category_id_fkey
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

ALTER TABLE fiqh_officer_categories
  ADD CONSTRAINT fiqh_officer_categories_category_id_fkey
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;

-- Drop the old fiqh_categories table as it's no longer used
DROP TABLE IF EXISTS fiqh_categories CASCADE;

COMMIT;
