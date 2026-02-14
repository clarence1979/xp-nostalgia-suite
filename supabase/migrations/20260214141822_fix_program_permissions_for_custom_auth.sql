/*
  # Fix Program Permissions for Custom Auth System

  1. Changes
    - Remove auth.uid() dependency since app uses custom authentication
    - Make functions callable by anyone (security is handled at application layer)
    - Simplified access control for custom auth system
*/

DROP FUNCTION IF EXISTS get_user_program_permissions(uuid);
DROP FUNCTION IF EXISTS update_user_program_permission(uuid, text, boolean);
DROP FUNCTION IF EXISTS get_accessible_programs();

CREATE OR REPLACE FUNCTION get_user_program_permissions(target_user_id uuid)
RETURNS TABLE (
  program_name text,
  has_access boolean
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH all_programs AS (
    SELECT name AS program_name
    FROM desktop_icons
    WHERE icon_type = 'program'
    
    UNION ALL
    
    SELECT 'VCE Section A' AS program_name
    UNION ALL
    SELECT 'VCE Section B' AS program_name
    UNION ALL
    SELECT 'VCE Section C' AS program_name
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

CREATE OR REPLACE FUNCTION update_user_program_permission(
  target_user_id uuid,
  program_name text,
  has_access boolean
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_program_permissions (user_id, program_name, has_access, updated_at)
  VALUES (target_user_id, program_name, has_access, now())
  ON CONFLICT (user_id, program_name)
  DO UPDATE SET 
    has_access = EXCLUDED.has_access,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION get_accessible_programs_for_user(target_user_id uuid)
RETURNS TABLE (
  program_name text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH all_programs AS (
    SELECT name AS program_name
    FROM desktop_icons
    WHERE icon_type IN ('program', 'system', 'folder', 'theme')
    
    UNION ALL
    
    SELECT 'VCE Section A' AS program_name
    UNION ALL
    SELECT 'VCE Section B' AS program_name
    UNION ALL
    SELECT 'VCE Section C' AS program_name
  )
  SELECT ap.program_name
  FROM all_programs ap
  LEFT JOIN user_program_permissions upp 
    ON upp.program_name = ap.program_name 
    AND upp.user_id = target_user_id
  WHERE COALESCE(upp.has_access, true) = true
  ORDER BY ap.program_name;
END;
$$;
