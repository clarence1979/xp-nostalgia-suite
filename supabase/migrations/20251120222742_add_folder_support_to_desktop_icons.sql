/*
  # Add Folder Support to Desktop Icons

  1. Changes
    - Modify `icon_type` check constraint to include 'folder' type
    - Modify `open_behavior` check constraint to include 'folder' behavior
    - Remove Recycle Bin entry
    - Add VCE Software Development folder entry

  2. Notes
    - This enables creating folder icons that can contain other icons
    - Folder contents will be stored in application state, not in the database
*/

-- Update icon_type constraint to include 'folder'
ALTER TABLE desktop_icons 
DROP CONSTRAINT IF EXISTS desktop_icons_icon_type_check;

ALTER TABLE desktop_icons 
ADD CONSTRAINT desktop_icons_icon_type_check 
CHECK (icon_type IN ('system', 'program', 'theme', 'folder'));

-- Update open_behavior constraint to include 'folder'
ALTER TABLE desktop_icons 
DROP CONSTRAINT IF EXISTS desktop_icons_open_behavior_check;

ALTER TABLE desktop_icons 
ADD CONSTRAINT desktop_icons_open_behavior_check 
CHECK (open_behavior IN ('window', 'new_tab', 'special', 'folder'));

-- Remove Recycle Bin
DELETE FROM desktop_icons WHERE name = 'Recycle Bin';

-- Add VCE Software Development folder
INSERT INTO desktop_icons (name, icon, description, url, icon_type, position_x, position_y, position_x_mobile, position_y_mobile, category, open_behavior, sort_order) 
VALUES ('VCE Software Development', 'Folder', 'VCE exam training resources', NULL, 'folder', 20, 220, 10, 170, NULL, 'folder', 3)
ON CONFLICT DO NOTHING;