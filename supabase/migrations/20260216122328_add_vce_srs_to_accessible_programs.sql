/*
  # Add VCE Software Requirement Specifications (SRS) to Program List
  
  1. Changes
    - Update get_user_program_permissions to include VCE SRS
    - Update get_accessible_programs_for_user to include VCE SRS
  
  2. Notes
    - This ensures VCE SRS appears in the VCE Software Development folder
    - URL: https://srs.bolt.host
*/

DROP FUNCTION IF EXISTS get_user_program_permissions(uuid);
DROP FUNCTION IF EXISTS get_accessible_programs_for_user(uuid);

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
    UNION ALL
    SELECT 'VCE Pseudocode' AS program_name
    UNION ALL
    SELECT 'VCE Lists Mastery' AS program_name
    UNION ALL
    SELECT 'VCE Software Requirement Specifications (SRS)' AS program_name
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
    UNION ALL
    SELECT 'VCE Pseudocode' AS program_name
    UNION ALL
    SELECT 'VCE Lists Mastery' AS program_name
    UNION ALL
    SELECT 'VCE Software Requirement Specifications (SRS)' AS program_name
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
