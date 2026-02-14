/*
  # Fix Comprehensive Security Issues

  1. Performance Improvements
    - Add index on desktop_icons.user_id foreign key
    - Fix secrets table RLS policies to use (select auth.xxx()) pattern
    
  2. RLS Policy Fixes
    - Remove overly permissive RPC policies on desktop_icons
    - Keep only user-owned policies for authenticated users
    - RPC functions will use SECURITY DEFINER to bypass RLS
    
  3. Function Security
    - Add search_path to all admin functions to prevent SQL injection
    
  4. Clean Up
    - Remove conflicting policies
    - Ensure single source of truth for permissions
*/

-- ============================================================================
-- 1. ADD MISSING INDEX ON FOREIGN KEY
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_desktop_icons_user_id 
ON desktop_icons(user_id);

-- ============================================================================
-- 2. DROP OVERLY PERMISSIVE RPC POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Allow RPC to insert desktop icons" ON desktop_icons;
DROP POLICY IF EXISTS "Allow RPC to update desktop icons" ON desktop_icons;
DROP POLICY IF EXISTS "Allow RPC to delete desktop icons" ON desktop_icons;

-- ============================================================================
-- 3. FIX SECRETS TABLE RLS POLICIES
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Allow admin to insert secrets" ON secrets;
DROP POLICY IF EXISTS "Allow admin to update secrets" ON secrets;
DROP POLICY IF EXISTS "Allow admin to delete secrets" ON secrets;

-- Recreate with optimized (select ...) pattern
CREATE POLICY "Allow admin to insert secrets"
  ON secrets
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_login
      WHERE username = (SELECT current_setting('request.jwt.claims', true)::json->>'username')
      AND is_admin = true
    )
  );

CREATE POLICY "Allow admin to update secrets"
  ON secrets
  FOR UPDATE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM users_login
      WHERE username = (SELECT current_setting('request.jwt.claims', true)::json->>'username')
      AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_login
      WHERE username = (SELECT current_setting('request.jwt.claims', true)::json->>'username')
      AND is_admin = true
    )
  );

CREATE POLICY "Allow admin to delete secrets"
  ON secrets
  FOR DELETE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM users_login
      WHERE username = (SELECT current_setting('request.jwt.claims', true)::json->>'username')
      AND is_admin = true
    )
  );

-- ============================================================================
-- 4. FIX FUNCTION SEARCH PATHS (SQL INJECTION PREVENTION)
-- ============================================================================

-- Drop and recreate functions with proper search_path

DROP FUNCTION IF EXISTS is_valid_admin_token(text);
CREATE OR REPLACE FUNCTION is_valid_admin_token(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth_tokens
    WHERE token = p_token
    AND is_admin = true
    AND expires_at > now()
  );
END;
$$;

DROP FUNCTION IF EXISTS admin_update_icon_position(text, uuid, integer, integer);
CREATE OR REPLACE FUNCTION admin_update_icon_position(
  p_token text,
  p_icon_id uuid,
  p_position_x integer,
  p_position_y integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  IF NOT is_valid_admin_token(p_token) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin token';
  END IF;

  UPDATE desktop_icons
  SET 
    position_x = p_position_x,
    position_y = p_position_y,
    updated_at = now()
  WHERE id = p_icon_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Icon not found';
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

DROP FUNCTION IF EXISTS admin_delete_icon(text, uuid);
CREATE OR REPLACE FUNCTION admin_delete_icon(
  p_token text,
  p_icon_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_icon_type text;
BEGIN
  IF NOT is_valid_admin_token(p_token) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin token';
  END IF;

  SELECT icon_type INTO v_icon_type
  FROM desktop_icons
  WHERE id = p_icon_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Icon not found';
  END IF;

  IF v_icon_type = 'system' THEN
    RAISE EXCEPTION 'Cannot delete system icons';
  END IF;

  DELETE FROM desktop_icons WHERE id = p_icon_id;

  RETURN json_build_object('success', true);
END;
$$;

DROP FUNCTION IF EXISTS admin_insert_icon(text, text, text, text, text, text, integer, integer);
CREATE OR REPLACE FUNCTION admin_insert_icon(
  p_token text,
  p_name text,
  p_icon text,
  p_description text,
  p_url text,
  p_open_behavior text,
  p_position_x integer,
  p_position_y integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_sort integer;
  v_new_id uuid;
BEGIN
  IF NOT is_valid_admin_token(p_token) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin token';
  END IF;

  SELECT COALESCE(MAX(sort_order), 0) + 1 INTO v_max_sort
  FROM desktop_icons;

  INSERT INTO desktop_icons (
    name, icon, description, url, icon_type, 
    position_x, position_y, position_x_mobile, position_y_mobile,
    open_behavior, sort_order
  ) VALUES (
    p_name, p_icon, p_description, p_url, 'program',
    p_position_x, p_position_y, p_position_x, p_position_y,
    p_open_behavior, v_max_sort
  )
  RETURNING id INTO v_new_id;

  RETURN json_build_object('success', true, 'id', v_new_id);
END;
$$;

DROP FUNCTION IF EXISTS admin_update_icon(text, uuid, text, text, text, text, text);
CREATE OR REPLACE FUNCTION admin_update_icon(
  p_token text,
  p_icon_id uuid,
  p_name text DEFAULT NULL,
  p_icon text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_url text DEFAULT NULL,
  p_open_behavior text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_valid_admin_token(p_token) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin token';
  END IF;

  UPDATE desktop_icons
  SET 
    name = COALESCE(p_name, name),
    icon = COALESCE(p_icon, icon),
    description = COALESCE(p_description, description),
    url = COALESCE(p_url, url),
    open_behavior = COALESCE(p_open_behavior, open_behavior),
    updated_at = now()
  WHERE id = p_icon_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Icon not found';
  END IF;

  RETURN json_build_object('success', true);
END;
$$;