/*
  # Add SAC Generator and VCE SD Exam Analysis to Program Permissions

  1. Changes
    - Add permission entries for "SAC Generator" and "VCE SD Exam Analysis" programs
    - Grant access to all existing users who have access to other VCE programs

  2. Notes
    - Follows the same pattern as previous VCE program permission migrations
    - Users with any VCE Section A/B/C access automatically get access to these new tools
*/

INSERT INTO user_program_permissions (user_id, program_name, has_access)
SELECT DISTINCT user_id, 'SAC Generator', true
FROM user_program_permissions
WHERE program_name IN ('VCE Section A', 'VCE Section B', 'VCE Section C')
ON CONFLICT (user_id, program_name) DO NOTHING;

INSERT INTO user_program_permissions (user_id, program_name, has_access)
SELECT DISTINCT user_id, 'VCE SD Exam Analysis', true
FROM user_program_permissions
WHERE program_name IN ('VCE Section A', 'VCE Section B', 'VCE Section C')
ON CONFLICT (user_id, program_name) DO NOTHING;
