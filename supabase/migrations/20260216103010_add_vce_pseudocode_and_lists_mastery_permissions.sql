/*
  # Add VCE Pseudocode and VCE Lists Mastery to Program Permissions
  
  1. Changes
    - Add permission entries for "VCE Pseudocode" and "VCE Lists Mastery" programs
    - Grant access to all existing users who have other VCE program access
  
  2. Security
    - Maintains existing RLS policies
    - Grants access to users with existing VCE program permissions
*/

-- Add VCE Pseudocode and VCE Lists Mastery permissions for all users who have access to other VCE programs
INSERT INTO user_program_permissions (user_id, program_name, has_access)
SELECT DISTINCT user_id, 'VCE Pseudocode', true
FROM user_program_permissions
WHERE program_name IN ('VCE Section A', 'VCE Section B', 'VCE Section C')
ON CONFLICT (user_id, program_name) DO NOTHING;

INSERT INTO user_program_permissions (user_id, program_name, has_access)
SELECT DISTINCT user_id, 'VCE Lists Mastery', true
FROM user_program_permissions
WHERE program_name IN ('VCE Section A', 'VCE Section B', 'VCE Section C')
ON CONFLICT (user_id, program_name) DO NOTHING;
