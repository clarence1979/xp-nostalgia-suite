/*
  # Update AI Generator URL to V2

  1. Changes
    - Updates the "AI 2D, 3D, QR and Video Generator" URL
    - Changes from https://replicate.bolt.host to https://replicatev2.bolt.host/
*/

UPDATE desktop_icons
SET url = 'https://replicatev2.bolt.host/'
WHERE name = 'AI 2D, 3D, QR and Video Generator';
