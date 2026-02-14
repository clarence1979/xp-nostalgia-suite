/*
  # Remove Internet Explorer and My Documents Icons

  1. Changes
    - Remove "Internet Explorer" desktop icon
    - Remove "My Documents" desktop icon
    
  These icons are being removed at user request to clean up the desktop interface.
*/

DELETE FROM desktop_icons 
WHERE name IN ('Internet Explorer', 'My Documents');
