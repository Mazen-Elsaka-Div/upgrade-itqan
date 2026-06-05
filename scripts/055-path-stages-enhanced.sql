-- Migration 055: Enhanced Path Stages
-- Adds stage_type and foreign keys to tajweed_path_stages to support courses, halaqat, and lessons.

ALTER TABLE tajweed_path_stages ADD COLUMN IF NOT EXISTS stage_type VARCHAR(20) DEFAULT 'custom' CHECK (stage_type IN ('custom', 'course', 'halaqa', 'lesson'));
ALTER TABLE tajweed_path_stages ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE SET NULL;
ALTER TABLE tajweed_path_stages ADD COLUMN IF NOT EXISTS halaqa_id UUID REFERENCES halaqat(id) ON DELETE SET NULL;
ALTER TABLE tajweed_path_stages ADD COLUMN IF NOT EXISTS lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL;
