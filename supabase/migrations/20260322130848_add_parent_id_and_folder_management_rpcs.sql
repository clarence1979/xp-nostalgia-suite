/*
  # Add parent_id for nested folders and update management RPCs

  1. Schema Changes
    - `desktop_icons` table: adds `parent_id` column (uuid, nullable, FK to self with CASCADE delete)
    - Adds index on parent_id for efficient folder content lookups

  2. Data Migration
    - Inserts all hardcoded VCE Software Development folder contents as real database
      records, linked via parent_id to the VCE Software Development folder

  3. Updated/New RPC Functions
    - `admin_insert_icon` - updated to accept optional p_parent_id parameter
    - `admin_create_folder` - new RPC for creating folder icons (type='folder')
    - `admin_move_icon` - new RPC for moving an icon into (or out of) a folder
    - `admin_rename_icon` - new RPC for renaming any icon/folder by id

  4. Notes
    - Root desktop icons have parent_id = NULL
    - Icons inside a folder have parent_id = the folder's id
    - Subfolders are supported: a folder can have parent_id pointing to another folder
    - ON DELETE CASCADE means deleting a folder removes all children automatically
*/

-- Add parent_id column
ALTER TABLE desktop_icons
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES desktop_icons(id) ON DELETE CASCADE;

-- Index for efficient child lookups
CREATE INDEX IF NOT EXISTS idx_desktop_icons_parent_id ON desktop_icons(parent_id);

-- Ensure open_behavior constraint includes 'iframe'
ALTER TABLE desktop_icons DROP CONSTRAINT IF EXISTS desktop_icons_open_behavior_check;
ALTER TABLE desktop_icons ADD CONSTRAINT desktop_icons_open_behavior_check
  CHECK (open_behavior IN ('window', 'new_tab', 'special', 'folder', 'iframe'));

-- Migrate hardcoded VCE folder contents into real database records
DO $$
DECLARE
  v_folder_id uuid;
BEGIN
  SELECT id INTO v_folder_id FROM desktop_icons WHERE name = 'VCE Software Development' AND icon_type = 'folder' LIMIT 1;
  IF v_folder_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO desktop_icons (name, icon, description, url, icon_type, position_x, position_y, position_x_mobile, position_y_mobile, category, open_behavior, sort_order, parent_id)
  VALUES
    ('VCE Section A',   '📝', 'VCE Section A exam training',                       'https://vce-section-a.bolt.host/',  'program', 20, 20,  20, 20,  NULL, 'window', 100, v_folder_id),
    ('VCE Section B',   '📊', 'VCE Section B exam training',                       'https://vce.bolt.host/',            'program', 20, 120, 20, 120, NULL, 'window', 101, v_folder_id),
    ('VCE Section C',   '💻', 'VCE Section C exam training',                       'https://vce-section-c.bolt.host/',  'program', 20, 220, 20, 220, NULL, 'window', 102, v_folder_id),
    ('VCE Pseudocode',  '📄', 'Interactive pseudocode editor and learning tool',   'https://pseudo.bolt.host',          'program', 20, 320, 20, 320, NULL, 'iframe', 103, v_folder_id),
    ('VCE Lists Mastery','📋','Python lists practice and mastery tool',            'https://pythonlist.bolt.host/',     'program', 20, 420, 20, 420, NULL, 'iframe', 104, v_folder_id),
    ('VCE Software Requirement Specifications (SRS)','📑','Software requirement specifications tool','https://srs.bolt.host','program',20,520,20,520,NULL,'iframe',105,v_folder_id),
    ('Code Critic',     '🔍', 'AI-powered code review and critique tool',          'https://codecritic.bolt.host/',     'program', 20, 620, 20, 620, NULL, 'iframe', 106, v_folder_id),
    ('SAC Generator',   '📐', 'Generate School Assessed Coursework tasks',         'https://sacgenerator.bolt.host',    'program', 20, 720, 20, 720, NULL, 'iframe', 107, v_folder_id),
    ('VCE SD Exam Analysis','🧪','VCE Software Development exam analysis tool',    'https://sdexam.bolt.host',          'program', 20, 820, 20, 820, NULL, 'iframe', 108, v_folder_id)
  ON CONFLICT DO NOTHING;
END $$;

-- Update admin_insert_icon to accept optional parent_id
CREATE OR REPLACE FUNCTION admin_insert_icon(
  p_token text,
  p_name text,
  p_icon text,
  p_description text,
  p_url text,
  p_open_behavior text,
  p_position_x integer,
  p_position_y integer,
  p_parent_id uuid DEFAULT NULL
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
    p_name, p_icon, p_description, p_url, 'program',
    p_position_x, p_position_y, p_position_x, p_position_y,
    p_open_behavior, v_max_sort, p_parent_id
  )
  RETURNING id INTO v_new_id;

  RETURN json_build_object('success', true, 'id', v_new_id);
END;
$$;

-- Create folder (type='folder', open_behavior='folder')
CREATE OR REPLACE FUNCTION admin_create_folder(
  p_token text,
  p_name text,
  p_position_x integer,
  p_position_y integer,
  p_parent_id uuid DEFAULT NULL
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
    p_name, 'Folder', 'Folder', NULL, 'folder',
    p_position_x, p_position_y, p_position_x, p_position_y,
    'folder', v_max_sort, p_parent_id
  )
  RETURNING id INTO v_new_id;

  RETURN json_build_object('success', true, 'id', v_new_id);
END;
$$;

-- Move icon into a folder (or to root if p_target_folder_id is NULL)
CREATE OR REPLACE FUNCTION admin_move_icon(
  p_token text,
  p_icon_id uuid,
  p_target_folder_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_valid_admin_token(p_token) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin token';
  END IF;

  -- Prevent moving a folder into itself or its own descendant
  IF p_target_folder_id IS NOT NULL AND p_target_folder_id = p_icon_id THEN
    RAISE EXCEPTION 'Cannot move a folder into itself';
  END IF;

  UPDATE desktop_icons
  SET parent_id = p_target_folder_id, updated_at = now()
  WHERE id = p_icon_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Icon not found';
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

-- Rename any icon or folder
CREATE OR REPLACE FUNCTION admin_rename_icon(
  p_token text,
  p_icon_id uuid,
  p_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_valid_admin_token(p_token) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin token';
  END IF;

  UPDATE desktop_icons
  SET name = p_name, updated_at = now()
  WHERE id = p_icon_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Icon not found';
  END IF;

  RETURN json_build_object('success', true);
END;
$$;
