/*
  # Update Drone Programming to open in iframe
  
  1. Changes
    - Adds 'iframe' as a valid open_behavior option
    - Updates the Drone Programming icon's open_behavior from 'new_tab' to 'iframe'
    - This allows the drone programming interface to run embedded within the desktop environment
*/

-- Add 'iframe' to the allowed open_behavior values
ALTER TABLE desktop_icons 
DROP CONSTRAINT IF EXISTS desktop_icons_open_behavior_check;

ALTER TABLE desktop_icons
ADD CONSTRAINT desktop_icons_open_behavior_check 
CHECK (open_behavior = ANY (ARRAY['window'::text, 'new_tab'::text, 'special'::text, 'folder'::text, 'iframe'::text]));

-- Update Drone Programming to use iframe
UPDATE desktop_icons
SET open_behavior = 'iframe'
WHERE name = 'Drone Programming' AND open_behavior = 'new_tab';
