/*
  # Update Voice to 3D Printing to AI Generator
  
  1. Changes
    - Updates the existing "Voice to 3D Printing" desktop icon entry
    - Changes name to "AI 2D, 3D, QR and Video Generator"
    - Updates icon from 🖨️ to ✨
    - Updates description to reflect new AI generation capabilities
    - Updates URL to replicate.bolt.host
*/

UPDATE desktop_icons
SET 
  name = 'AI 2D, 3D, QR and Video Generator',
  icon = '✨',
  description = 'Generate images, 3D models, QR codes, and videos using AI',
  url = 'https://replicate.bolt.host'
WHERE name = 'Voice to 3D Printing' OR url LIKE '%print3d.bolt.host%' OR url LIKE '%voice-to-3d-print%';
