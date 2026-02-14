/*
  # Fix Accessible Programs RPC Function

  1. Changes
    - Update get_accessible_programs to remove parent_folder reference
    - Include all desktop icons and hardcoded VCE programs
    - Return comprehensive list of accessible programs for current user
*/

DROP FUNCTION IF EXISTS get_accessible_programs();

CREATE OR REPLACE FUNCTION get_accessible_programs()
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
    AND upp.user_id = auth.uid()
  WHERE COALESCE(upp.has_access, true) = true
  ORDER BY ap.program_name;
END;
$$;
