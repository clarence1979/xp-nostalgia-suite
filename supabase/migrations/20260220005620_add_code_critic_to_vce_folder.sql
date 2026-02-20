/*
  # Add Code Critic to VCE folder programs list

  ## Changes
  - Update get_accessible_programs_for_user to include 'Code Critic'
    so it appears in the permissions system and can be managed per user
*/

CREATE OR REPLACE FUNCTION get_accessible_programs_for_user(target_user_id uuid)
RETURNS TABLE(program_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    UNION ALL
    SELECT 'Code Critic' AS program_name
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
