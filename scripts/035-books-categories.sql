-- 035-books-categories.sql
-- Make book categories dynamic by linking books to the existing `categories`
-- hierarchy. A single root category ("كتاب") is created (or reused) so admins
-- can manage book sub-categories from /academy/admin/categories or the
-- inline manager on /admin/library/books.

-- 1. Ensure a root "كتاب" category exists. Use a stable slug so we can
--    reference it from app code without hard-coding an UUID.
INSERT INTO categories (id, name, slug, description, parent_id, display_order, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'كتاب', 'book', 'تصنيف رئيسي لكتب المكتبة', NULL, 1000, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'book');

-- 2. Add a category_id reference on books. Keep the legacy `category` VARCHAR
--    so existing data (if any) is not lost during migration.
ALTER TABLE books
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_books_category_id ON books(category_id);

-- 3. Best-effort backfill: for any book that still has a legacy `category`
--    slug, try to match an existing category by slug under the book root.
--    If no match, leave NULL — admin will set it from the UI.
UPDATE books b
SET category_id = c.id
FROM categories c
JOIN categories root ON root.id = c.parent_id AND root.slug = 'book'
WHERE b.category_id IS NULL
  AND b.category IS NOT NULL
  AND c.slug = b.category;
