/*
  # Update specific programs to iframe-only behavior
  
  1. Changes
    - Updates AI Note Taker, Magic Marker, Pantry Chef, and AI 2D, 3D, QR and Video Generator
    - Changes their open_behavior from 'window' to 'iframe'
    - This ensures they only open in an embedded iframe without the new tab fallback
*/

UPDATE desktop_icons
SET open_behavior = 'iframe'
WHERE name IN (
  'AI Note Taker',
  'Magic Marker',
  'Pantry Chef',
  'AI 2D, 3D, QR and Video Generator'
) AND open_behavior = 'window';
