/*
  # Add AI Council Desktop Icon
  
  1. Changes
    - Adds new desktop icon for AI Council
    - Positioned at (540, 20) for desktop
    - Positioned at (350, 170) for mobile
    - Categorized as 'general' tool
    - Uses 🏛️ icon (classical building) to represent council/governance
    
  2. Details
    - Name: AI Council
    - Description: Collaborative AI decision-making and advisory platform
    - URL: https://council.bolt.host
    - Sort order: 102 (grouped with general tools)
*/

INSERT INTO desktop_icons (name, icon, description, url, icon_type, category, position_x, position_y, position_x_mobile, position_y_mobile, open_behavior, sort_order) VALUES
  ('AI Council', '🏛️', 'Collaborative AI decision-making and advisory platform', 'https://council.bolt.host', 'program', 'general', 540, 20, 350, 170, 'window', 102)
ON CONFLICT DO NOTHING;
