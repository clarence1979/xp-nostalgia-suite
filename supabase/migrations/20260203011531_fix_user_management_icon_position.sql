/*
  # Fix User Management Icon Position

  1. Changes
    - Move User Management icon to avoid overlap with VS Code icon
    - Update desktop and mobile positions for better spacing
  
  2. New Position
    - Desktop: y=400 (above VS Code)
    - Mobile: y=600 (below on mobile)
*/

-- Update User Management icon position
UPDATE desktop_icons
SET 
  position_y = 400,
  position_y_mobile = 600
WHERE name = 'User Management';