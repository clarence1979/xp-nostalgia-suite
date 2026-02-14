/*
  # Add RPC Functions for Program Permissions Management

  1. Functions
    - `get_user_program_permissions(target_user_id uuid)` - Get all program permissions for a user
    - `update_user_program_permission(target_user_id uuid, program_name text, has_access boolean)` - Update a single program permission
    - `get_accessible_programs()` - Get list of programs accessible to the current user
    
  2. Security
    - Only admins can call get_user_program_permissions and update_user_program_permission
    - Any authenticated user can call get_accessible_programs for themselves
*/

-- Function to get all program permissions for a user (admin only)
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
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM users_login
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only admins can view user program permissions';
  END IF;

  -- Return all programs with their access status
  -- If no record exists, default to true (has access)
  RETURN QUERY
  SELECT 
    di.name AS program_name,
    COALESCE(upp.has_access, true) AS has_access
  FROM desktop_icons di
  LEFT JOIN user_program_permissions upp 
    ON upp.program_name = di.name 
    AND upp.user_id = target_user_id
  WHERE di.parent_folder IS NULL
  ORDER BY di.name;
END;
$$;

-- Function to update a single program permission (admin only)
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
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM users_login
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only admins can update user program permissions';
  END IF;

  -- Insert or update the permission
  INSERT INTO user_program_permissions (user_id, program_name, has_access, updated_at)
  VALUES (target_user_id, program_name, has_access, now())
  ON CONFLICT (user_id, program_name)
  DO UPDATE SET 
    has_access = EXCLUDED.has_access,
    updated_at = now();
END;
$$;

-- Function to get accessible programs for the current user
CREATE OR REPLACE FUNCTION get_accessible_programs()
RETURNS TABLE (
  program_name text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Return all programs where user has access
  -- If no record exists, default to true (has access)
  RETURN QUERY
  SELECT di.name AS program_name
  FROM desktop_icons di
  LEFT JOIN user_program_permissions upp 
    ON upp.program_name = di.name 
    AND upp.user_id = auth.uid()
  WHERE 
    di.parent_folder IS NULL
    AND COALESCE(upp.has_access, true) = true
  ORDER BY di.name;
END;
$$;
