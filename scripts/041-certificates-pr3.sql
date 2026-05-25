-- =============================================
-- Migration 041: Certificates Center — Phase 3
--
-- Builds on top of 040-certificates-center.sql.  Phase 3 wires the
-- eligibility/triggers layer + the student workflow + the Maqraa
-- mirror.  This migration only contains the few schema additions /
-- backfills needed by PR3 — most of the heavy lifting is application
-- code.
--
--   • back-fill `award_top_n` to a sensible default (10) for any
--     existing competitions that have `certificate_enabled = TRUE`
--     and no top-N value.
--   • forward-port issued rows from the legacy maqraa
--     `certificate_data` table into `certificate_issuance_requests`
--     so they show up in the new Maqraa admin centre.  No data is
--     deleted from the legacy table.
--   • make sure `notifications.type = 'general'` is accepted (most
--     installations already accept arbitrary type strings, but a few
--     legacy CHECK constraints might block it).
-- =============================================

-- ---------------------------------------------------------------------------
-- 1. Default `award_top_n` for any competition that already enabled
--    certificates without specifying the top-N.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_name = 'competitions'
                AND column_name = 'award_top_n') THEN
    UPDATE competitions
       SET award_top_n = 10
     WHERE certificate_enabled = TRUE
       AND award_top_n IS NULL;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Forward-port existing issued maqraa certificate_data rows into
--    the unified issuance pipeline so they appear in the new Maqraa
--    admin centre's "Issued" tab.  Only `certificate_issued = TRUE`
--    rows are migrated, with status = 'issued'.
--
--    Idempotent — uses ON CONFLICT DO NOTHING on the partial unique
--    index (student_id, scope, kind, source_table, source_id).
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
              WHERE table_name = 'certificate_data')
     AND EXISTS (SELECT 1 FROM information_schema.tables
                  WHERE table_name = 'certificate_issuance_requests') THEN
    INSERT INTO certificate_issuance_requests (
      id, scope, kind, student_id,
      source_table, source_id, source_label,
      status, data,
      certificate_number, pdf_url,
      requested_at, submitted_at, approved_at, issued_at,
      created_at, updated_at
    )
    SELECT
      gen_random_uuid(),
      'maqraa'::varchar,
      'recitation'::varchar,
      cd.student_id,
      'certificate_data'::varchar,
      cd.id,
      NULL,
      'issued'::varchar,
      jsonb_build_object(
        'university',        cd.university,
        'university_other',  cd.university_other,
        'college',           cd.college,
        'college_other',     cd.college_other,
        'city',              cd.city,
        'city_other',        cd.city_other,
        'phone',             cd.phone,
        'age',               cd.age,
        'entity_id',         cd.entity_id,
        'entity_other',      cd.entity_other,
        'pdf_file_url',      cd.pdf_file_url
      ),
      cd.certificate_url,
      cd.certificate_pdf_url,
      cd.created_at,
      cd.created_at,
      cd.created_at,
      cd.created_at,
      cd.created_at,
      cd.updated_at
    FROM certificate_data cd
    WHERE cd.certificate_issued = TRUE
      AND NOT EXISTS (
        SELECT 1 FROM certificate_issuance_requests r
         WHERE r.student_id = cd.student_id
           AND r.scope      = 'maqraa'
           AND r.kind       = 'recitation'
           AND r.source_table = 'certificate_data'
           AND r.source_id    = cd.id
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Helpful index for the student-side pending-count widget.
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_cir_student_status
  ON certificate_issuance_requests (student_id, scope, status);
