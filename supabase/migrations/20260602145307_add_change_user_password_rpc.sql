/*
  # Add change_user_password RPC function

  ## Summary
  The ChangePassword component previously relied on anon direct-table access to
  read and update users_login, which is blocked by the current RLS posture.
  This adds a dedicated SECURITY DEFINER function that validates the current
  password and performs the update in a single, safe, RLS-bypassing call.

  ## New Function
  - `change_user_password(p_username text, p_current_password text, p_new_password text)`
    - Verifies current password before allowing update
    - Updates password and clears must_change_password flag
    - Returns jsonb { success: true } or raises an exception on failure

  ## Security
  - SECURITY DEFINER runs as DB owner, bypasses RLS
  - Fixed search_path to prevent search_path hijacking
  - EXECUTE revoked from PUBLIC, anon, and authenticated — callable only via
    service_role through the admin-rpc edge function
  - The function itself validates the current password, so no admin token is
    needed (the old password IS the proof of identity)
*/

CREATE OR REPLACE FUNCTION public.change_user_password(
  p_username       text,
  p_current_password text,
  p_new_password   text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stored_password text;
BEGIN
  IF p_username IS NULL OR p_current_password IS NULL OR p_new_password IS NULL THEN
    RAISE EXCEPTION 'All parameters are required';
  END IF;

  IF length(p_new_password) < 4 THEN
    RAISE EXCEPTION 'New password must be at least 4 characters';
  END IF;

  SELECT password INTO v_stored_password
  FROM users_login
  WHERE username = p_username;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF v_stored_password <> p_current_password THEN
    RAISE EXCEPTION 'Current password is incorrect';
  END IF;

  UPDATE users_login
  SET password = p_new_password,
      must_change_password = false
  WHERE username = p_username;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.change_user_password(text, text, text) FROM PUBLIC, anon, authenticated;
