/*
  # Update all programs to iframe-only behavior
  
  1. Changes
    - Updates Visual Studio Code URL to https://vscode.dev/ and sets to iframe behavior
    - Changes all remaining programs with 'window' or 'new_tab' behavior to 'iframe'
    - This ensures all programs only open in embedded iframes without new tab fallbacks
    
  2. Affected Programs
    - Visual Studio Code: URL set to https://vscode.dev/, behavior changed to iframe
    - All other programs: behavior changed from window/new_tab to iframe
*/

-- Update Visual Studio Code with correct URL and iframe behavior
UPDATE desktop_icons
SET 
  url = 'https://vscode.dev/',
  open_behavior = 'iframe'
WHERE name = 'Visual Studio Code';

-- Update all other programs to iframe-only behavior
UPDATE desktop_icons
SET open_behavior = 'iframe'
WHERE icon_type = 'program' 
  AND open_behavior IN ('window', 'new_tab')
  AND name != 'Visual Studio Code';
