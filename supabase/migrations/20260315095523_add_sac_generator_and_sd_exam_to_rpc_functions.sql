/*
  # Add SAC Generator and VCE SD Exam Analysis to RPC Functions

  1. Changes
    - Update get_user_program_permissions to include SAC Generator and VCE SD Exam Analysis
    - Update get_accessible_programs_for_user to include SAC Generator and VCE SD Exam Analysis

  2. Notes
    - These programs are hardcoded in the VCE Software Development folder contents
    - Adding them to the RPC functions ensures they appear correctly in the folder for all users
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
    UNION ALL
    SELECT 'Code Critic' AS program_name
    UNION ALL
    SELECT 'SAC Generator' AS program_name
    UNION ALL
    SELECT 'VCE SD Exam Analysis' AS program_name
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
    UNION ALL
    SELECT 'Code Critic' AS program_name
    UNION ALL
    SELECT 'SAC Generator' AS program_name
    UNION ALL
    SELECT 'VCE SD Exam Analysis' AS program_name
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
