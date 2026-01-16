/*
  # Remove Notepad Desktop Icon
  
  1. Changes
    - Removes the Notepad desktop icon from the database
    
  2. Details
    - Notepad was previously accessible on the desktop
    - This migration removes it completely
*/

DELETE FROM desktop_icons WHERE name = 'Notepad';
