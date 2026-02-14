/*
  # Fix Program Permissions RPC Functions

  1. Changes
    - Update get_user_program_permissions to remove parent_folder reference
    - Include all desktop icons and hardcoded VCE programs
    - Return comprehensive list of all programs for access control
*/

DROP FUNCTION IF EXISTS get_user_program_permissions(uuid);

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
  IF NOT EXISTS (
    SELECT 1 FROM users_login
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only admins can view user program permissions';
  END IF;

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
