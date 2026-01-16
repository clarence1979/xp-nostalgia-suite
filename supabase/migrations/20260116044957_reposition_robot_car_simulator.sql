/*
  # Reposition Robot Car Simulator
  
  1. Changes
    - Move Robot Car Simulator icon to just below Tutoring Chatbot on desktop
    
  2. Details
    - Robot Car Simulator moved from position (440, 520) to (340, 120) on desktop
    - Mobile position updated to (265, 90)
*/

-- Update Robot Car Simulator position to be below Tutoring Chatbot
UPDATE desktop_icons 
SET 
  position_x = 340,
  position_y = 120,
  position_x_mobile = 265,
  position_y_mobile = 90
WHERE name = 'Robot Car Simulator';
