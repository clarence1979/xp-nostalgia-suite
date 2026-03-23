/*
  # Update admin_create_folder to accept optional icon parameter

  1. Changes
    - `admin_create_folder` RPC: adds optional `p_icon` parameter (defaults to 'Folder')
      so callers can specify a folder color like 'Folder:blue' at creation time

  2. Notes
    - Backwards compatible - existing calls without p_icon still work
*/

CREATE OR REPLACE FUNCTION admin_create_folder(
  p_token text,
  p_name text,
  p_position_x integer,
  p_position_y integer,
  p_parent_id uuid DEFAULT NULL,
  p_icon text DEFAULT 'Folder'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max_sort integer;
  v_new_id uuid;
BEGIN
  IF NOT is_valid_admin_token(p_token) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin token';
  END IF;

  SELECT COALESCE(MAX(sort_order), 0) + 1 INTO v_max_sort
  FROM desktop_icons;

  INSERT INTO desktop_icons (
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
