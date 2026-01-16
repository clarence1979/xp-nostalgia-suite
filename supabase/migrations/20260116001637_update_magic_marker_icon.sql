/*
  # Update Magic Marker Icon
  
  1. Changes
    - Updates the Magic Marker icon from ✨ to ✅
    - More appropriate for a marking/grading tool
*/

UPDATE desktop_icons
SET icon = '✅'
WHERE name = 'Magic Marker';
