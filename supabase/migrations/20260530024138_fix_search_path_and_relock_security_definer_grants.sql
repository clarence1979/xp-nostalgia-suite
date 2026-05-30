/*
  # Fix mutable search_path and re-lock SECURITY DEFINER function grants

  ## Problems addressed

  1. Mutable search_path
     - `get_user_program_permissions` and `update_user_program_permission` lack a
       fixed search_path, making them vulnerable to search_path hijacking.
     - Fix: recreate both with `SET search_path = public`.

  2. SECURITY DEFINER functions still reachable by anon / authenticated
     - Functions that were revoked in a previous migration appear to have been
       re-created since (CREATE OR REPLACE resets grants to PUBLIC by default).
     - Fix: REVOKE from PUBLIC and authenticated, then GRANT to anon only for
       functions the frontend legitimately calls with the anon key.

  ## Grant policy
  - Functions called exclusively by edge functions (service_role bypasses grants):
      create_auth_token, log_api_key_usage, validate_notepad_password,
      cleanup_expired_auth_tokens, cleanup_expired_tokens
    → NOT re-granted to anon.
  - All other listed functions are called directly from the frontend with the
    anon key → GRANT to anon only, never to authenticated or public.
*/

-- ============================================================
-- Step 1: Recreate mutable-search_path functions with fixed path
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_program_permissions(
  p_token text,
  target_user_id uuid
)
RETURNS TABLE(program_name text, has_access boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_valid_admin_token(p_token) THEN
    RAISE EXCEPTION 'Unauthorized: invalid or expired admin token';
  END IF;

  RETURN QUERY
  WITH all_programs AS (
    SELECT name AS program_name
    FROM desktop_icons
    WHERE icon_type = 'program'

    UNION ALL SELECT 'VCE Section A'
    UNION ALL SELECT 'VCE Section B'
    UNION ALL SELECT 'VCE Section C'
    UNION ALL SELECT 'VCE Pseudocode'
    UNION ALL SELECT 'VCE Lists Mastery'
    UNION ALL SELECT 'VCE Software Requirement Specifications (SRS)'
    UNION ALL SELECT 'Code Critic'
    UNION ALL SELECT 'SAC Generator'
    UNION ALL SELECT 'VCE SD Exam Analysis'
  )
  SELECT
    ap.program_name,
    COALESCE(upp.has_access, true) AS has_access
  FROM all_programs ap
  LEFT JOIN user_program_permissions upp
    ON upp.program_name = ap.program_name
   AND upp.user_id = target_user_id
  ORDER BY ap.program_name;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_program_permission(
  p_token text,
  target_user_id uuid,
  program_name text,
  has_access boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_valid_admin_token(p_token) THEN
    RAISE EXCEPTION 'Unauthorized: invalid or expired admin token';
  END IF;

  INSERT INTO user_program_permissions (user_id, program_name, has_access, updated_at)
  VALUES (target_user_id, program_name, has_access, now())
  ON CONFLICT (user_id, program_name)
  DO UPDATE SET
    has_access = EXCLUDED.has_access,
    updated_at = now();
END;
$$;

-- ============================================================
-- Step 2: Revoke EXECUTE from PUBLIC on every flagged function
--   (CREATE OR REPLACE resets to PUBLIC by default, so we must
--    revoke after every recreation)
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.admin_create_folder(text, text, integer, integer, uuid)                               FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_create_folder(text, text, integer, integer, uuid, text)                         FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_icon(text, uuid)                                                         FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_notice(text, uuid)                                                       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_insert_icon(text, text, text, text, text, text, integer, integer)               FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_insert_icon(text, text, text, text, text, text, integer, integer, uuid)         FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_move_icon(text, uuid, uuid)                                                     FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_pin_notice(text, uuid, boolean)                                                 FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_post_notice(text, text, text)                                                   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_rename_icon(text, uuid, text)                                                   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_icon(text, uuid, text, text, text, text, text)                           FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_icon_position(text, uuid, integer, integer)                              FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_widget_state(text, text, integer, integer, integer, integer, boolean)    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_auth_token(text, text, boolean)                                               FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_secret_by_id(text, uuid)                                                      FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_accessible_programs_for_user(uuid)                                               FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_api_key_usage_stats_admin(text)                                                  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_login_frequency_24h(text)                                                        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_login_logs_admin(text, integer, text)                                            FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_program_permissions(text, uuid)                                             FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_user_login(text, text, text, text)                                            FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_secret_by_id(text, uuid, text, text, text)                                    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_user_program_permission(text, uuid, text, boolean)                            FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.upsert_secret(text, text, text, text)                                                FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_notepad_password(text)                                                      FROM PUBLIC;

-- ============================================================
-- Step 3: Also revoke from authenticated explicitly
--   (authenticated inherits PUBLIC; belt-and-suspenders revoke
--    prevents access even if PUBLIC grant slips back in future)
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.get_user_program_permissions(text, uuid)          FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_user_program_permission(text, uuid, text, boolean) FROM authenticated;

-- ============================================================
-- Step 4: Re-grant to anon for frontend-callable functions only
-- ============================================================

-- Desktop icon management (desktopIconService.ts)
GRANT EXECUTE ON FUNCTION public.admin_create_folder(text, text, integer, integer, uuid)                               TO anon;
GRANT EXECUTE ON FUNCTION public.admin_create_folder(text, text, integer, integer, uuid, text)                         TO anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_icon(text, uuid)                                                         TO anon;
GRANT EXECUTE ON FUNCTION public.admin_insert_icon(text, text, text, text, text, text, integer, integer)               TO anon;
GRANT EXECUTE ON FUNCTION public.admin_insert_icon(text, text, text, text, text, text, integer, integer, uuid)         TO anon;
GRANT EXECUTE ON FUNCTION public.admin_move_icon(text, uuid, uuid)                                                     TO anon;
GRANT EXECUTE ON FUNCTION public.admin_rename_icon(text, uuid, text)                                                   TO anon;
GRANT EXECUTE ON FUNCTION public.admin_update_icon(text, uuid, text, text, text, text, text)                           TO anon;
GRANT EXECUTE ON FUNCTION public.admin_update_icon_position(text, uuid, integer, integer)                              TO anon;

-- Notices
GRANT EXECUTE ON FUNCTION public.admin_delete_notice(text, uuid)                                                       TO anon;
GRANT EXECUTE ON FUNCTION public.admin_pin_notice(text, uuid, boolean)                                                 TO anon;
GRANT EXECUTE ON FUNCTION public.admin_post_notice(text, text, text)                                                   TO anon;

-- Widget state
GRANT EXECUTE ON FUNCTION public.admin_update_widget_state(text, text, integer, integer, integer, integer, boolean)    TO anon;

-- Secrets / API key management
GRANT EXECUTE ON FUNCTION public.delete_secret_by_id(text, uuid)                                                      TO anon;
GRANT EXECUTE ON FUNCTION public.get_api_key_usage_stats_admin(text)                                                  TO anon;
GRANT EXECUTE ON FUNCTION public.update_secret_by_id(text, uuid, text, text, text)                                    TO anon;
GRANT EXECUTE ON FUNCTION public.upsert_secret(text, text, text, text)                                                TO anon;

-- Program permissions
GRANT EXECUTE ON FUNCTION public.get_accessible_programs_for_user(uuid)                                               TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_program_permissions(text, uuid)                                             TO anon;
GRANT EXECUTE ON FUNCTION public.update_user_program_permission(text, uuid, text, boolean)                            TO anon;

-- Login logs
GRANT EXECUTE ON FUNCTION public.get_login_frequency_24h(text)                                                        TO anon;
GRANT EXECUTE ON FUNCTION public.get_login_logs_admin(text, integer, text)                                            TO anon;

-- Login event recording (called from frontend loginLogger.ts)
GRANT EXECUTE ON FUNCTION public.record_user_login(text, text, text, text)                                            TO anon;
