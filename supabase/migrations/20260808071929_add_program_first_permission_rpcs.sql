/*
# Add RPC to get all users' access status for a given program

1. New Functions
   - `get_program_users_access(p_token text, p_program_name text)` — Returns every user from
     `users_login` along with their `has_access` status for the given program. Users without
     an explicit row in `user_program_permissions` default to `true` (the app's default-allow model).
   - `bulk_update_program_permissions(p_token text, p_program_name text, p_user_ids uuid[], p_has_access boolean)` —
     Upserts access for multiple users at once for a single program, avoiding N sequential RPCs.

2. Security
   - Both functions are SECURITY DEFINER with search_path = public.
   - Admin token validation required.
   - EXECUTE granted only to authenticated role.
*/

CREATE OR REPLACE FUNCTION get_program_users_access(p_token text, p_program_name text)
RETURNS TABLE(user_id uuid, username text, is_admin boolean, is_active boolean, has_access boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username text;
  v_is_admin boolean;
BEGIN
  SELECT at.username, at.is_admin INTO v_username, v_is_admin
  FROM auth_tokens at
  WHERE at.token = p_token AND at.expires_at > now();

  IF v_username IS NULL OR NOT v_is_admin THEN
    RAISE EXCEPTION 'Unauthorized: admin token required';
  END IF;

  RETURN QUERY
  SELECT
    ul.id AS user_id,
    ul.username,
    ul.is_admin,
    ul.is_active,
    COALESCE(upp.has_access, true) AS has_access
  FROM users_login ul
  LEFT JOIN user_program_permissions upp
    ON upp.user_id = ul.id AND upp.program_name = p_program_name
  ORDER BY ul.username;
END;
$$;

CREATE OR REPLACE FUNCTION bulk_update_program_permissions(
  p_token text,
  p_program_name text,
  p_user_ids uuid[],
  p_has_access boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username text;
  v_is_admin boolean;
  v_uid uuid;
BEGIN
  SELECT at.username, at.is_admin INTO v_username, v_is_admin
  FROM auth_tokens at
  WHERE at.token = p_token AND at.expires_at > now();

  IF v_username IS NULL OR NOT v_is_admin THEN
    RAISE EXCEPTION 'Unauthorized: admin token required';
  END IF;

  FOREACH v_uid IN ARRAY p_user_ids LOOP
    INSERT INTO user_program_permissions (user_id, program_name, has_access, updated_at)
    VALUES (v_uid, p_program_name, p_has_access, now())
    ON CONFLICT (user_id, program_name) DO UPDATE
    SET has_access = p_has_access, updated_at = now();
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION get_program_users_access(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_program_users_access(text, text) TO authenticated;

REVOKE ALL ON FUNCTION bulk_update_program_permissions(text, text, uuid[], boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION bulk_update_program_permissions(text, text, uuid[], boolean) TO authenticated;
