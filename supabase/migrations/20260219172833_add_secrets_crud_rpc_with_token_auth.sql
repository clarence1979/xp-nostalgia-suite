/*
  # Add Secrets CRUD RPC Functions with Token-Based Auth

  ## Problem
  The existing RLS policies for the secrets table rely on JWT claims
  (current_setting('request.jwt.claims')) which are empty when using the
  custom authentication system with anon key. This causes all write operations
  (insert, update, delete) to silently fail for admin users.

  ## Solution
  Add SECURITY DEFINER RPC functions that:
  1. Accept an auth_token parameter
  2. Validate the token against the auth_tokens table
  3. Confirm the user has is_admin = true
  4. Perform the operation using elevated privileges

  ## New Functions
  - upsert_secret(p_token, p_key_name, p_key_value, p_description) - Insert or update
  - delete_secret(p_token, p_key_id) - Delete by ID
*/

-- Function to insert or update a secret (upsert by key_name)
CREATE OR REPLACE FUNCTION upsert_secret(
  p_token text,
  p_key_name text,
  p_key_value text,
  p_description text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_result jsonb;
BEGIN
  -- Validate token and check admin status
  SELECT is_admin INTO v_is_admin
  FROM auth_tokens
  WHERE token = p_token
    AND expires_at > now();

  IF v_is_admin IS NULL OR v_is_admin = false THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Upsert the secret
  INSERT INTO secrets (key_name, key_value, description)
  VALUES (p_key_name, p_key_value, p_description)
  ON CONFLICT (key_name) DO UPDATE
    SET key_value = EXCLUDED.key_value,
        description = EXCLUDED.description,
        updated_at = now();

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Function to update a secret by ID
CREATE OR REPLACE FUNCTION update_secret_by_id(
  p_token text,
  p_id uuid,
  p_key_name text,
  p_key_value text,
  p_description text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT is_admin INTO v_is_admin
  FROM auth_tokens
  WHERE token = p_token
    AND expires_at > now();

  IF v_is_admin IS NULL OR v_is_admin = false THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  UPDATE secrets
  SET key_name = p_key_name,
      key_value = p_key_value,
      description = p_description,
      updated_at = now()
  WHERE id = p_id;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Function to delete a secret by ID
CREATE OR REPLACE FUNCTION delete_secret_by_id(
  p_token text,
  p_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT is_admin INTO v_is_admin
  FROM auth_tokens
  WHERE token = p_token
    AND expires_at > now();

  IF v_is_admin IS NULL OR v_is_admin = false THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  DELETE FROM secrets WHERE id = p_id;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permissions to anon role
GRANT EXECUTE ON FUNCTION upsert_secret(text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION update_secret_by_id(text, uuid, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION delete_secret_by_id(text, uuid) TO anon;
