/*
  # Fix Secrets RPC Functions - Drop and Recreate as Void

  ## Problem
  The JSONB-returning RPC functions behave differently from the existing void-returning
  admin_* functions that are known to work. Recreating them to return void and raise
  exceptions on error instead of returning error JSON.

  ## Changes
  - Drop and recreate upsert_secret, update_secret_by_id, delete_secret_by_id
  - Now return void instead of jsonb
  - RAISE EXCEPTION on unauthorized instead of returning error JSON
*/

DROP FUNCTION IF EXISTS upsert_secret(text, text, text, text);
DROP FUNCTION IF EXISTS update_secret_by_id(text, uuid, text, text, text);
DROP FUNCTION IF EXISTS delete_secret_by_id(text, uuid);

CREATE OR REPLACE FUNCTION upsert_secret(
  p_token text,
  p_key_name text,
  p_key_value text,
  p_description text DEFAULT ''
)
RETURNS void
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
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO secrets (key_name, key_value, description)
  VALUES (p_key_name, p_key_value, p_description)
  ON CONFLICT (key_name) DO UPDATE
    SET key_value = EXCLUDED.key_value,
        description = EXCLUDED.description,
        updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION update_secret_by_id(
  p_token text,
  p_id uuid,
  p_key_name text,
  p_key_value text,
  p_description text DEFAULT ''
)
RETURNS void
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
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE secrets
  SET key_name = p_key_name,
      key_value = p_key_value,
      description = p_description,
      updated_at = now()
  WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION delete_secret_by_id(
  p_token text,
  p_id uuid
)
RETURNS void
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
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  DELETE FROM secrets WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_secret(text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION update_secret_by_id(text, uuid, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION delete_secret_by_id(text, uuid) TO anon;
