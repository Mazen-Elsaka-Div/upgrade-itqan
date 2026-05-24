-- 033-fiqh-custom-fields.sql
-- Create table for dynamic Fiqh question form fields
-- These fields will be displayed to users asking questions and stored as JSONB in fiqh_questions.

CREATE TABLE IF NOT EXISTS fiqh_form_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,  -- e.g., 'age', 'marital_status'
    label_ar VARCHAR(255) NOT NULL,     -- e.g., 'العمر', 'الحالة الاجتماعية'
    type VARCHAR(50) NOT NULL DEFAULT 'text', -- 'text', 'number', 'select'
    options JSONB,                      -- Array of strings if type = 'select'
    is_required BOOLEAN NOT NULL DEFAULT false,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add extra_data column to fiqh_questions to store the answers to these custom fields
ALTER TABLE fiqh_questions
ADD COLUMN IF NOT EXISTS extra_data JSONB DEFAULT '{}'::jsonb;
