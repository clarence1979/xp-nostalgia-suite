/*
  # Update AI Council URL
  
  1. Changes
    - Update AI Council program URL to point to new Vercel deployment
    
  2. Details
    - Changes URL from 'https://council.bolt.host' to 'https://a-icouncil.vercel.app/'
*/

-- Update AI Council URL
UPDATE desktop_icons 
SET url = 'https://a-icouncil.vercel.app/'
WHERE name = 'AI Council';
