/*
  # Reposition AI Council and Remove Physics Simulator
  
  1. Changes
    - Move AI Council icon to just below Visual Studio Code on desktop
    - Remove Physics Simulator icon from desktop
    
  2. Details
    - AI Council moved from position (540, 20) to (20, 520) on desktop
    - AI Council mobile position updated to (10, 410)
    - Physics Simulator completely removed from database
*/

-- Update AI Council position to be below Visual Studio Code
UPDATE desktop_icons 
SET 
  position_x = 20,
  position_y = 520,
  position_x_mobile = 10,
  position_y_mobile = 410
WHERE name = 'AI Council';

-- Remove Physics Simulator
DELETE FROM desktop_icons WHERE name = 'Physics Simulator';
