-- Add is_recording_shared column to course_sessions
ALTER TABLE course_sessions 
ADD COLUMN IF NOT EXISTS is_recording_shared BOOLEAN DEFAULT false;
