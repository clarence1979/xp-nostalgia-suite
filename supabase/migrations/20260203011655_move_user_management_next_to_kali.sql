/*
  # Move User Management Icon Next to Kali Linux Display

  1. Changes
    - Position User Management icon to the right of Kali Linux Display
    - Update both desktop and mobile positions
  
  2. New Position
    - Desktop: x=560, y=20 (right of Kali Linux Display at 440, 20)
    - Mobile: Keep reasonable mobile position
*/

-- Update User Management icon position
UPDATE desktop_icons
SET 
  position_x = 560,
  position_y = 20,
  position_x_mobile = 110,
  position_y_mobile = 490
WHERE name = 'User Management';