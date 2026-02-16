/*
  # Reposition Desktop Icons to Avoid Overlaps

  ## Changes Made
  
  This migration repositions all default desktop icons to ensure no overlaps on both desktop and mobile views.
  
  ### Desktop Layout (Grid: 100px horizontal, 100px vertical spacing)
  - Row 1 (y=20): My Computer, AI Note Taker, Tool Hub, Tutoring Chatbot, Kali Linux Display, User Management
  - Row 2 (y=120): Python IDE, Magic Marker, Teacher Scheduler, Robot Car Simulator, Code Blocks, VB.NET IDE
  - Row 3 (y=220): VCE Software, Student Emotion, Quiz Master, Math Genius, Electronics Lab, City Builder
  - Row 4 (y=320): History, Pantry Chef, Code Class, Hacking Simulator
  - Row 5 (y=420): AI Council, Drone Programming, AUSLAN, Dream Tales, Scientific Sims
  - Row 6 (y=520): VS Code, AI Generator, Network Tracer, MP3 Player, Lenny Bot
  
  ### Mobile Layout (Grid: 85px horizontal, 80px vertical spacing)
  - Arranged in proper grid to fit mobile screens
  - All icons now have valid mobile positions
  
  ## Issues Fixed
  - Fixed "History" and "Pantry Chef" overlapping at (240, 320)
  - Added missing mobile positions for Python IDE, VB.NET IDE, and City Builder
  - Ensured consistent spacing throughout
  - Maintained logical grouping where possible
*/

-- Reposition all default desktop icons to avoid overlaps
-- Desktop view: 100px spacing (icons are ~80px, so 100px provides clear separation)
-- Mobile view: 85px horizontal, 80px vertical spacing

-- Row 1 (Desktop y=20, Mobile y=10)
UPDATE desktop_icons SET position_x = 20, position_y = 20, position_x_mobile = 10, position_y_mobile = 10 
WHERE name = 'My Computer' AND user_id IS NULL;

UPDATE desktop_icons SET position_x = 120, position_y = 20, position_x_mobile = 95, position_y_mobile = 10 
WHERE name = 'AI Note Taker' AND user_id IS NULL;

UPDATE desktop_icons SET position_x = 220, position_y = 20, position_x_mobile = 180, position_y_mobile = 10 
WHERE name = 'Tool Hub' AND user_id IS NULL;

UPDATE desktop_icons SET position_x = 320, position_y = 20, position_x_mobile = 265, position_y_mobile = 10 
WHERE name = 'Tutoring Chatbot' AND user_id IS NULL;

UPDATE desktop_icons SET position_x = 420, position_y = 20, position_x_mobile = 350, position_y_mobile = 10 
WHERE name = 'Kali Linux Display' AND user_id IS NULL;

UPDATE desktop_icons SET position_x = 520, position_y = 20, position_x_mobile = 10, position_y_mobile = 90 
WHERE name = 'User Management' AND user_id IS NULL;

-- Row 2 (Desktop y=120, Mobile y=170)
UPDATE desktop_icons SET position_x = 20, position_y = 120, position_x_mobile = 95, position_y_mobile = 90 
WHERE name = 'Python IDE' AND user_id IS NULL;

UPDATE desktop_icons SET position_x = 120, position_y = 120, position_x_mobile = 180, position_y_mobile = 90 
WHERE name = 'Magic Marker' AND user_id IS NULL;

UPDATE desktop_icons SET position_x = 220, position_y = 120, position_x_mobile = 265, position_y_mobile = 90 
WHERE name = 'Teacher Scheduler' AND user_id IS NULL;

UPDATE desktop_icons SET position_x = 320, position_y = 120, position_x_mobile = 350, position_y_mobile = 90 
WHERE name = 'Robot Car Simulator' AND user_id IS NULL;

UPDATE desktop_icons SET position_x = 420, position_y = 120, position_x_mobile = 10, position_y_mobile = 170 
WHERE name = 'Code Blocks' AND user_id IS NULL;

UPDATE desktop_icons SET position_x = 520, position_y = 120, position_x_mobile = 95, position_y_mobile = 170 
WHERE name = 'VB.NET Web Visual IDE' AND user_id IS NULL;

-- Row 3 (Desktop y=220, Mobile y=250)
UPDATE desktop_icons SET position_x = 20, position_y = 220, position_x_mobile = 180, position_y_mobile = 170 
WHERE name = 'VCE Software Development' AND user_id IS NULL;

UPDATE desktop_icons SET position_x = 120, position_y = 220, position_x_mobile = 265, position_y_mobile = 170 
WHERE name = 'Student Emotion Recognition' AND user_id IS NULL;

UPDATE desktop_icons SET position_x = 220, position_y = 220, position_x_mobile = 350, position_y_mobile = 170 
WHERE name = 'Quiz Master Pro' AND user_id IS NULL;

UPDATE desktop_icons SET position_x = 320, position_y = 220, position_x_mobile = 10, position_y_mobile = 250 
WHERE name = 'Math Genius' AND user_id IS NULL;

UPDATE desktop_icons SET position_x = 420, position_y = 220, position_x_mobile = 95, position_y_mobile = 250 
WHERE name = 'Electronics Lab' AND user_id IS NULL;

UPDATE desktop_icons SET position_x = 520, position_y = 220, position_x_mobile = 180, position_y_mobile = 250 
WHERE name = 'City Builder Game' AND user_id IS NULL;

-- Row 4 (Desktop y=320, Mobile y=330) - Fixed overlap between History and Pantry Chef
UPDATE desktop_icons SET position_x = 20, position_y = 320, position_x_mobile = 265, position_y_mobile = 250 
WHERE name = 'History' AND user_id IS NULL;

UPDATE desktop_icons SET position_x = 120, position_y = 320, position_x_mobile = 350, position_y_mobile = 250 
WHERE name = 'Pantry Chef' AND user_id IS NULL;

UPDATE desktop_icons SET position_x = 220, position_y = 320, position_x_mobile = 10, position_y_mobile = 330 
WHERE name = 'Code Class' AND user_id IS NULL;

UPDATE desktop_icons SET position_x = 320, position_y = 320, position_x_mobile = 95, position_y_mobile = 330 
WHERE name = 'Hacking Simulator' AND user_id IS NULL;

-- Row 5 (Desktop y=420, Mobile y=410)
UPDATE desktop_icons SET position_x = 20, position_y = 420, position_x_mobile = 180, position_y_mobile = 330 
WHERE name = 'AI Council' AND user_id IS NULL;

UPDATE desktop_icons SET position_x = 120, position_y = 420, position_x_mobile = 265, position_y_mobile = 330 
WHERE name = 'Drone Programming' AND user_id IS NULL;

UPDATE desktop_icons SET position_x = 220, position_y = 420, position_x_mobile = 350, position_y_mobile = 330 
WHERE name = 'AUSLAN' AND user_id IS NULL;

UPDATE desktop_icons SET position_x = 320, position_y = 420, position_x_mobile = 10, position_y_mobile = 410 
WHERE name = 'Dream Tales' AND user_id IS NULL;

UPDATE desktop_icons SET position_x = 420, position_y = 420, position_x_mobile = 95, position_y_mobile = 410 
WHERE name = 'Scientific Simulations' AND user_id IS NULL;

-- Row 6 (Desktop y=520, Mobile y=490)
UPDATE desktop_icons SET position_x = 20, position_y = 520, position_x_mobile = 180, position_y_mobile = 410 
WHERE name = 'Visual Studio Code' AND user_id IS NULL;

UPDATE desktop_icons SET position_x = 120, position_y = 520, position_x_mobile = 265, position_y_mobile = 410 
WHERE name = 'AI 2D, 3D, QR and Video Generator' AND user_id IS NULL;

UPDATE desktop_icons SET position_x = 220, position_y = 520, position_x_mobile = 350, position_y_mobile = 410 
WHERE name = 'Network Route Tracer' AND user_id IS NULL;

UPDATE desktop_icons SET position_x = 320, position_y = 520, position_x_mobile = 10, position_y_mobile = 490 
WHERE name = 'MP3 Player' AND user_id IS NULL;

UPDATE desktop_icons SET position_x = 420, position_y = 520, position_x_mobile = 95, position_y_mobile = 490 
WHERE name = 'Lenny Bot' AND user_id IS NULL;
