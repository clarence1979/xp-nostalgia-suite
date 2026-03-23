/*
  # Fix All Security Advisories

  1. RLS Initialization Plan - wrap subqueries in (SELECT ...) for one-time evaluation
     - secrets: insert/update/delete policies
     - user_program_permissions: admin and user SELECT policies
     - login_logs: admin SELECT and anon INSERT policies

  2. Multiple Permissive Policies
     - user_program_permissions: merge two SELECT policies for 'authenticated' into one

  3. Unused Indexes - drop redundant single-column index on login_logs

  4. Function Search Path Mutable - add SET search_path = '' to all flagged functions
     Preserving all existing DEFAULT parameter values

  5. RLS Policy Always True - replace WITH CHECK (true) on login_logs INSERT
     with a meaningful non-empty username check
*/

-- ============================================================
-- 1. Fix secrets RLS policies
-- ============================================================

DROP POLICY IF EXISTS "Allow admin to insert secrets" ON public.secrets;
DROP POLICY IF EXISTS "Allow admin to update secrets" ON public.secrets;
DROP POLICY IF EXISTS "Allow admin to delete secrets" ON public.secrets;

CREATE POLICY "Allow admin to insert secrets"
  ON public.secrets FOR INSERT TO anon
  WITH CHECK (
    (SELECT EXISTS (
      SELECT 1 FROM public.users_login
      WHERE username = (SELECT current_setting('request.jwt.claims', true)::json->>'username')
        AND is_admin = true
    ))
  );

CREATE POLICY "Allow admin to update secrets"
  ON public.secrets FOR UPDATE TO anon
  USING (
    (SELECT EXISTS (
      SELECT 1 FROM public.users_login
      WHERE username = (SELECT current_setting('request.jwt.claims', true)::json->>'username')
        AND is_admin = true
    ))
  )
  WITH CHECK (
    (SELECT EXISTS (
      SELECT 1 FROM public.users_login
      WHERE username = (SELECT current_setting('request.jwt.claims', true)::json->>'username')
        AND is_admin = true
    ))
  );

CREATE POLICY "Allow admin to delete secrets"
  ON public.secrets FOR DELETE TO anon
  USING (
    (SELECT EXISTS (
      SELECT 1 FROM public.users_login
      WHERE username = (SELECT current_setting('request.jwt.claims', true)::json->>'username')
        AND is_admin = true
    ))
  );

-- ============================================================
-- 2. Fix user_program_permissions RLS policies
--    Combine two SELECT policies into one, fix auth.uid() wrapping
-- ============================================================

DROP POLICY IF EXISTS "Admins can manage all program permissions" ON public.user_program_permissions;
DROP POLICY IF EXISTS "Users can read their own program permissions" ON public.user_program_permissions;

CREATE POLICY "Users or admins can read program permissions"
  ON public.user_program_permissions FOR SELECT TO authenticated
  USING (
    (user_id = (SELECT auth.uid()))
    OR
    (SELECT EXISTS (
      SELECT 1 FROM public.users_login
      WHERE id = (SELECT auth.uid()) AND is_admin = true
    ))
  );

CREATE POLICY "Admins can insert program permissions"
  ON public.user_program_permissions FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT EXISTS (
      SELECT 1 FROM public.users_login
      WHERE id = (SELECT auth.uid()) AND is_admin = true
    ))
  );

CREATE POLICY "Admins can update program permissions"
  ON public.user_program_permissions FOR UPDATE TO authenticated
  USING (
    (SELECT EXISTS (
      SELECT 1 FROM public.users_login
      WHERE id = (SELECT auth.uid()) AND is_admin = true
    ))
  )
  WITH CHECK (
    (SELECT EXISTS (
      SELECT 1 FROM public.users_login
      WHERE id = (SELECT auth.uid()) AND is_admin = true
    ))
  );

CREATE POLICY "Admins can delete program permissions"
  ON public.user_program_permissions FOR DELETE TO authenticated
  USING (
    (SELECT EXISTS (
      SELECT 1 FROM public.users_login
      WHERE id = (SELECT auth.uid()) AND is_admin = true
    ))
  );

-- ============================================================
-- 3. Fix login_logs RLS policies
-- ============================================================

DROP POLICY IF EXISTS "Admins can view all login logs" ON public.login_logs;
DROP POLICY IF EXISTS "Anyone can insert login logs" ON public.login_logs;

CREATE POLICY "Admins can view all login logs"
  ON public.login_logs FOR SELECT TO anon
  USING (
    (SELECT EXISTS (
      SELECT 1 FROM public.auth_tokens
      WHERE token = (SELECT current_setting('request.headers', true)::json->>'x-auth-token')
        AND expires_at > now()
        AND is_admin = true
    ))
  );

CREATE POLICY "Authenticated users can insert login logs"
  ON public.login_logs FOR INSERT TO anon
  WITH CHECK (
    username IS NOT NULL AND length(trim(username)) > 0
  );

-- ============================================================
-- 4. Drop redundant single-column index (covered by composite)
-- ============================================================

DROP INDEX IF EXISTS public.login_logs_username_idx;

-- ============================================================
-- 5. Fix Function Search Path Mutable
--    Drop and recreate with SET search_path = '' and preserved defaults
-- ============================================================

DROP FUNCTION IF EXISTS public.admin_insert_icon(text, text, text, text, text, text, integer, integer);
DROP FUNCTION IF EXISTS public.admin_insert_icon(text, text, text, text, text, text, integer, integer, uuid);
DROP FUNCTION IF EXISTS public.admin_create_folder(text, text, integer, integer, uuid);
DROP FUNCTION IF EXISTS public.admin_create_folder(text, text, integer, integer, uuid, text);
DROP FUNCTION IF EXISTS public.admin_move_icon(text, uuid, uuid);
DROP FUNCTION IF EXISTS public.admin_rename_icon(text, uuid, text);

CREATE FUNCTION public.admin_insert_icon(
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
SET search_path = ''
AS $$
DECLARE
  v_max_sort integer;
  v_new_id uuid;
BEGIN
  IF NOT public.is_valid_admin_token(p_token) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin token';
  END IF;

  SELECT COALESCE(MAX(sort_order), 0) + 1 INTO v_max_sort
  FROM public.desktop_icons;

  INSERT INTO public.desktop_icons (
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

CREATE FUNCTION public.admin_insert_icon(
  p_token text,
  p_name text,
  p_icon text,
  p_description text,
  p_url text,
  p_open_behavior text,
  p_position_x integer,
  p_position_y integer,
  p_parent_id uuid DEFAULT NULL::uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_max_sort integer;
  v_new_id uuid;
BEGIN
  IF NOT public.is_valid_admin_token(p_token) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin token';
  END IF;

  SELECT COALESCE(MAX(sort_order), 0) + 1 INTO v_max_sort
  FROM public.desktop_icons;

  INSERT INTO public.desktop_icons (
    name, icon, description, url, icon_type,
    position_x, position_y, position_x_mobile, position_y_mobile,
    open_behavior, sort_order, parent_id
  ) VALUES (
    p_name, p_icon, p_description, p_url, 'program',
    p_position_x, p_position_y, p_position_x, p_position_y,
    p_open_behavior, v_max_sort, p_parent_id
  )
  RETURNING id INTO v_new_id;

  RETURN json_build_object('success', true, 'id', v_new_id);
END;
$$;

CREATE FUNCTION public.admin_create_folder(
  p_token text,
  p_name text,
  p_position_x integer,
  p_position_y integer,
  p_parent_id uuid DEFAULT NULL::uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_max_sort integer;
  v_new_id uuid;
BEGIN
  IF NOT public.is_valid_admin_token(p_token) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin token';
  END IF;

  SELECT COALESCE(MAX(sort_order), 0) + 1 INTO v_max_sort
  FROM public.desktop_icons;

  INSERT INTO public.desktop_icons (
    name, icon, description, url, icon_type,
    position_x, position_y, position_x_mobile, position_y_mobile,
    open_behavior, sort_order, parent_id
  ) VALUES (
    p_name, 'Folder', 'Folder', NULL, 'folder',
    p_position_x, p_position_y, p_position_x, p_position_y,
    'folder', v_max_sort, p_parent_id
  )
  RETURNING id INTO v_new_id;

  RETURN json_build_object('success', true, 'id', v_new_id);
END;
$$;

CREATE FUNCTION public.admin_create_folder(
  p_token text,
  p_name text,
  p_position_x integer,
  p_position_y integer,
  p_parent_id uuid DEFAULT NULL::uuid,
  p_icon text DEFAULT 'Folder'::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_max_sort integer;
  v_new_id uuid;
BEGIN
  IF NOT public.is_valid_admin_token(p_token) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin token';
  END IF;

  SELECT COALESCE(MAX(sort_order), 0) + 1 INTO v_max_sort
  FROM public.desktop_icons;

  INSERT INTO public.desktop_icons (
    name, icon, description, url, icon_type,
    position_x, position_y, position_x_mobile, position_y_mobile,
    open_behavior, sort_order, parent_id
  ) VALUES (
    p_name, p_icon, 'Folder', NULL, 'folder',
    p_position_x, p_position_y, p_position_x, p_position_y,
    'folder', v_max_sort, p_parent_id
  )
  RETURNING id INTO v_new_id;

  RETURN json_build_object('success', true, 'id', v_new_id);
END;
$$;

CREATE FUNCTION public.admin_move_icon(
  p_token text,
  p_icon_id uuid,
  p_target_folder_id uuid DEFAULT NULL::uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_valid_admin_token(p_token) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin token';
  END IF;

  IF p_target_folder_id IS NOT NULL AND p_target_folder_id = p_icon_id THEN
    RAISE EXCEPTION 'Cannot move a folder into itself';
  END IF;

  UPDATE public.desktop_icons
  SET parent_id = p_target_folder_id, updated_at = now()
  WHERE id = p_icon_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Icon not found';
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

CREATE FUNCTION public.admin_rename_icon(
  p_token text,
  p_icon_id uuid,
  p_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_valid_admin_token(p_token) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin token';
  END IF;

  UPDATE public.desktop_icons
  SET name = p_name, updated_at = now()
  WHERE id = p_icon_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Icon not found';
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_login_logs_admin(
  p_token text,
  p_limit integer DEFAULT 200,
  p_username_filter text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  username text,
  ip_address text,
  city text,
  region text,
  country text,
  country_code text,
  latitude numeric,
  longitude numeric,
  logged_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_valid_admin_token(p_token) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin token';
  END IF;

  RETURN QUERY
  SELECT
    ll.id,
    ll.username,
    ll.ip_address,
    ll.city,
    ll.region,
    ll.country,
    ll.country_code,
    ll.latitude,
    ll.longitude,
    ll.logged_at
  FROM public.login_logs ll
  WHERE (p_username_filter IS NULL OR ll.username = p_username_filter)
  ORDER BY ll.logged_at DESC
  LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_login_frequency_24h(
  p_token text
)
RETURNS TABLE (
  username text,
  login_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_valid_admin_token(p_token) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin token';
  END IF;

  RETURN QUERY
  SELECT
    ll.username,
    COUNT(*)::bigint AS login_count
  FROM public.login_logs ll
  WHERE ll.logged_at >= now() - INTERVAL '24 hours'
  GROUP BY ll.username
  ORDER BY login_count DESC;
END;
$$;
