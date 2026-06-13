-- ============================================
-- 061: Parent Table Consolidation
-- Migrates remaining data from parent_student_links to parent_children,
-- drops the old table and its triggers, and creates the parent dashboard functions.
-- ============================================

BEGIN;

-- ----------------------------------------
-- 1) Migrate any remaining data from parent_student_links → parent_children
-- ----------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parent_student_links') THEN
    -- Insert rows that weren't already migrated by 022
    INSERT INTO parent_children (parent_id, child_id, relation, status, created_at, updated_at)
    SELECT
      psl.parent_id,
      psl.student_id,
      LOWER(psl.relationship_type),
      CASE
        WHEN psl.is_active AND psl.verified THEN 'active'
        WHEN psl.is_active AND NOT psl.verified THEN 'pending'
        ELSE 'removed'
      END,
      psl.created_at,
      COALESCE(psl.updated_at, psl.created_at)
    FROM parent_student_links psl
    ON CONFLICT (parent_id, child_id) DO UPDATE
    SET
      -- Keep the newer created_at, prefer active status
      created_at = LEAST(parent_children.created_at, EXCLUDED.created_at),
      status = CASE
        WHEN EXCLUDED.status = 'active' THEN 'active'
        WHEN parent_children.status = 'active' THEN 'active'
        ELSE EXCLUDED.status
      END,
      updated_at = GREATEST(parent_children.updated_at, EXCLUDED.updated_at);

    RAISE NOTICE 'Migrated remaining rows from parent_student_links to parent_children';
  ELSE
    RAISE NOTICE 'parent_student_links does not exist — skipping migration';
  END IF;
END $$;

-- ----------------------------------------
-- 2) Drop parent_student_links triggers first (to avoid FK issues on drop)
-- ----------------------------------------
DROP TRIGGER IF EXISTS trg_validate_parent_role ON parent_student_links;
DROP TRIGGER IF EXISTS trg_validate_student_role ON parent_student_links;

-- ----------------------------------------
-- 3) Drop parent_student_links and its audit table
-- ----------------------------------------
DROP TABLE IF EXISTS parent_student_link_audit CASCADE;
DROP TABLE IF EXISTS parent_student_links CASCADE;

-- ----------------------------------------
-- 4) Drop old functions that referenced parent_student_links
-- ----------------------------------------
DROP FUNCTION IF EXISTS get_parent_students(UUID);
DROP FUNCTION IF EXISTS get_student_parents(UUID);
DROP FUNCTION IF EXISTS validate_parent_role() CASCADE;
DROP FUNCTION IF EXISTS validate_student_role() CASCADE;

-- ----------------------------------------
-- 5) Create get_parent_dashboard_overview function
--    Returns: parent info, child summary counts, and per-child overview
-- ----------------------------------------
CREATE OR REPLACE FUNCTION get_parent_dashboard_overview(p_parent_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  parent_info JSONB;
  children_overview JSONB;
  summary JSONB;
BEGIN
  -- Parent info
  SELECT jsonb_build_object(
    'id', u.id,
    'name', u.name,
    'email', u.email,
    'avatar_url', u.avatar_url
  ) INTO parent_info
  FROM users u
  WHERE u.id = p_parent_id;

  -- Summary counts
  SELECT jsonb_build_object(
    'total_children', COUNT(*) FILTER (WHERE pc.status = 'active'),
    'pending_requests', COUNT(*) FILTER (WHERE pc.status = 'pending'),
    'rejected_links', COUNT(*) FILTER (WHERE pc.status = 'rejected'),
    'active_count', COUNT(*) FILTER (WHERE pc.status = 'active')
  ) INTO summary
  FROM parent_children pc
  WHERE pc.parent_id = p_parent_id;

  -- Per-child overview for active children
  WITH active_children AS (
    SELECT pc.id AS link_id, pc.child_id, pc.relation, pc.created_at AS linked_at
    FROM parent_children pc
    WHERE pc.parent_id = p_parent_id AND pc.status = 'active'
  ),
  child_enrollments AS (
    SELECT
      ac.child_id,
      COUNT(e.id) AS total_courses,
      COUNT(e.id) FILTER (WHERE LOWER(e.status) = 'active') AS active_courses,
      COUNT(e.id) FILTER (WHERE LOWER(e.status) = 'completed') AS completed_courses,
      ROUND(AVG(COALESCE(e.progress_percentage, 0)))::INT AS avg_progress
    FROM active_children ac
    LEFT JOIN enrollments e ON e.student_id = ac.child_id
    GROUP BY ac.child_id
  ),
  recent_recitations AS (
    SELECT
      ac.child_id,
      COUNT(r.id) AS total_recitations,
      MAX(r.created_at) AS last_recitation_at
    FROM active_children ac
    LEFT JOIN recitations r ON r.student_id = ac.child_id
      AND r.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY ac.child_id
  ),
  recent_bookings AS (
    SELECT
      ac.child_id,
      COUNT(b.id) AS upcoming_bookings
    FROM active_children ac
    LEFT JOIN bookings b ON b.student_id = ac.child_id
      AND b.scheduled_at >= NOW()
      AND b.status NOT IN ('cancelled', 'completed')
    GROUP BY ac.child_id
  ),
  weekly_activity AS (
    SELECT
      ac.child_id,
      COUNT(r.id) AS recitations_this_week,
      COUNT(b.id) AS bookings_this_week
    FROM active_children ac
    LEFT JOIN recitations r ON r.student_id = ac.child_id
      AND r.created_at >= NOW() - INTERVAL '7 days'
    LEFT JOIN bookings b ON b.student_id = ac.child_id
      AND b.scheduled_at >= NOW() - INTERVAL '7 days'
    GROUP BY ac.child_id
  ),
  badges AS (
    SELECT
      ac.child_id,
      COUNT(pb.id) AS total_badges
    FROM active_children ac
    LEFT JOIN student_badges pb ON pb.student_id = ac.child_id
    GROUP BY ac.child_id
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'link_id', ac.link_id,
        'child_id', ac.child_id,
        'child_name', u.name,
        'child_avatar', u.avatar_url,
        'relation', ac.relation,
        'linked_at', ac.linked_at,
        'enrollments', jsonb_build_object(
          'total', COALESCE(ce.total_courses, 0),
          'active', COALESCE(ce.active_courses, 0),
          'completed', COALESCE(ce.completed_courses, 0),
          'avg_progress', COALESCE(ce.avg_progress, 0)
        ),
        'recitations', jsonb_build_object(
          'total_30d', COALESCE(rr.total_recitations, 0),
          'last_at', rr.last_recitation_at
        ),
        'bookings', jsonb_build_object(
          'upcoming', COALESCE(rb.upcoming_bookings, 0)
        ),
        'weekly_activity', jsonb_build_object(
          'recitations', COALESCE(wa.recitations_this_week, 0),
          'bookings', COALESCE(wa.bookings_this_week, 0)
        ),
        'badges', jsonb_build_object(
          'total', COALESCE(b.total_badges, 0)
        )
      )
    ),
    '[]'::jsonb
  ) INTO children_overview
  FROM active_children ac
  JOIN users u ON u.id = ac.child_id
  LEFT JOIN child_enrollments ce ON ce.child_id = ac.child_id
  LEFT JOIN recent_recitations rr ON rr.child_id = ac.child_id
  LEFT JOIN recent_bookings rb ON rb.child_id = ac.child_id
  LEFT JOIN weekly_activity wa ON wa.child_id = ac.child_id
  LEFT JOIN badges b ON b.child_id = ac.child_id;

  result := jsonb_build_object(
    'parent', parent_info,
    'summary', summary,
    'children', children_overview
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- ----------------------------------------
-- 6) Create get_parent_child_detail function
--    Returns detailed info about a single child for the parent dashboard
-- ----------------------------------------
CREATE OR REPLACE FUNCTION get_parent_child_detail(
  p_parent_id UUID,
  p_child_id UUID
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  link_record RECORD;
  child_info JSONB;
  enrollments_data JSONB;
  recent_recitations_data JSONB;
  upcoming_bookings_data JSONB;
  weekly_activity_data JSONB;
  badges_data JSONB;
  progress_data JSONB;
BEGIN
  -- Verify the link exists and is active
  SELECT pc.id, pc.relation, pc.created_at, pc.confirmed_at
  INTO link_record
  FROM parent_children pc
  WHERE pc.parent_id = p_parent_id
    AND pc.child_id = p_child_id
    AND pc.status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Child not linked or not active');
  END IF;

  -- Child info
  SELECT jsonb_build_object(
    'id', u.id,
    'name', u.name,
    'email', u.email,
    'avatar_url', u.avatar_url,
    'gender', u.gender,
    'created_at', u.created_at
  ) INTO child_info
  FROM users u
  WHERE u.id = p_child_id;

  -- Enrollments
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', e.id,
        'course_id', e.course_id,
        'course_title', c.title,
        'status', e.status,
        'progress', ROUND(COALESCE(e.progress_percentage, 0))::INT,
        'enrolled_at', e.created_at
      )
    ),
    '[]'::jsonb
  ) INTO enrollments_data
  FROM enrollments e
  JOIN courses c ON c.id = e.course_id
  WHERE e.student_id = p_child_id
  ORDER BY e.created_at DESC;

  -- Recent recitations (last 30 days)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'surah_name', r.surah_name,
        'surah_number', r.surah_number,
        'grade', r.grade,
        'notes', r.notes,
        'created_at', r.created_at
      )
    ),
    '[]'::jsonb
  ) INTO recent_recitations_data
  FROM (
    SELECT *
    FROM recitations
    WHERE student_id = p_child_id
    ORDER BY created_at DESC
    LIMIT 20
  ) r;

  -- Upcoming bookings
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', b.id,
        'reader_name', u.name,
        'scheduled_at', b.scheduled_at,
        'status', b.status,
        'meeting_link', b.meeting_link
      )
    ),
    '[]'::jsonb
  ) INTO upcoming_bookings_data
  FROM bookings b
  JOIN users u ON u.id = b.reader_id
  WHERE b.student_id = p_child_id
    AND b.scheduled_at >= NOW()
    AND b.status NOT IN ('cancelled')
  ORDER BY b.scheduled_at ASC
  LIMIT 10;

  -- Weekly activity (last 7 days breakdown)
  WITH days AS (
    SELECT generate_series(0, 6) AS day_offset
  ),
  activity AS (
    SELECT
      EXTRACT(DAY FROM NOW() - created_at)::INT AS day_offset,
      COUNT(*) AS cnt
    FROM recitations
    WHERE student_id = p_child_id
      AND created_at >= NOW() - INTERVAL '7 days'
    GROUP BY EXTRACT(DAY FROM NOW() - created_at)
    UNION ALL
    SELECT
      EXTRACT(DAY FROM NOW() - submitted_at)::INT AS day_offset,
      COUNT(*) AS cnt
    FROM task_submissions
    WHERE student_id = p_child_id
      AND submitted_at >= NOW() - INTERVAL '7 days'
    GROUP BY EXTRACT(DAY FROM NOW() - submitted_at)
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'day_offset', d.day_offset,
        'count', COALESCE(a.cnt, 0)
      )
      ORDER BY d.day_offset
    ),
    '[]'::jsonb
  ) INTO weekly_activity_data
  FROM days d
  LEFT JOIN activity a ON a.day_offset = d.day_offset;

  -- Badges
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', sb.id,
        'badge_name', bd.name,
        'badge_description', bd.description,
        'badge_icon', bd.icon_url,
        'earned_at', sb.earned_at
      )
    ),
    '[]'::jsonb
  ) INTO badges_data
  FROM student_badges sb
  LEFT JOIN badge_definitions bd ON bd.id = sb.badge_id
  WHERE sb.student_id = p_child_id
  ORDER BY sb.earned_at DESC
  LIMIT 10;

  -- Overall progress
  SELECT jsonb_build_object(
    'total_courses', COUNT(*),
    'active_courses', COUNT(*) FILTER (WHERE LOWER(e.status) = 'active'),
    'completed_courses', COUNT(*) FILTER (WHERE LOWER(e.status) = 'completed'),
    'avg_progress', ROUND(COALESCE(AVG(e.progress_percentage), 0))::INT,
    'total_recitations_30d', (
      SELECT COUNT(*) FROM recitations
      WHERE student_id = p_child_id
        AND created_at >= NOW() - INTERVAL '30 days'
    )
  ) INTO progress_data
  FROM enrollments e
  WHERE e.student_id = p_child_id;

  result := jsonb_build_object(
    'link', jsonb_build_object(
      'id', link_record.id,
      'relation', link_record.relation,
      'linked_at', link_record.created_at,
      'confirmed_at', link_record.confirmed_at
    ),
    'child', child_info,
    'progress', progress_data,
    'enrollments', enrollments_data,
    'recent_recitations', recent_recitations_data,
    'upcoming_bookings', upcoming_bookings_data,
    'weekly_activity', weekly_activity_data,
    'badges', badges_data
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

COMMIT;
