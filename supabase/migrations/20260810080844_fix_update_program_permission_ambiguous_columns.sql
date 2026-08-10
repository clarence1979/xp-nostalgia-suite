/*
# Fix ambiguous column references in update_user_program_permission

The function parameters `program_name` and `has_access` clash with identically-named
columns in the `user_program_permissions` table, causing a "column reference is ambiguous"
error on every call. Renaming the parameters to use a `p_` prefix resolves the ambiguity.
*/

DROP FUNCTION IF EXISTS update_user_program_permission(text, uuid, text, boolean);

CREATE OR REPLACE FUNCTION update_user_program_permission(
  p_token text,
  target_user_id uuid,
  p_program_name text,
  p_has_access boolean
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
  VALUES (target_user_id, p_program_name, p_has_access, now())
  ON CONFLICT (user_id, program_name)
  DO UPDATE SET
    has_access = EXCLUDED.has_access,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION update_user_program_permission(text, uuid, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_user_program_permission(text, uuid, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_program_permission(text, uuid, text, boolean) TO service_role;
