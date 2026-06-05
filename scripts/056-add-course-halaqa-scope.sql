-- Migration 056: Add Scope to Courses and Halaqat
ALTER TABLE courses ADD COLUMN IF NOT EXISTS scope VARCHAR(20) DEFAULT 'public' CHECK (scope IN ('public', 'path_only'));
ALTER TABLE halaqat ADD COLUMN IF NOT EXISTS scope VARCHAR(20) DEFAULT 'public' CHECK (scope IN ('public', 'path_only'));

-- Update existing to public (since it's the default, but just to be sure if they were NULL)
UPDATE courses SET scope = 'public' WHERE scope IS NULL;
UPDATE halaqat SET scope = 'public' WHERE scope IS NULL;
