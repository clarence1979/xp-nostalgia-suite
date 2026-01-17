/*
  # Update AI Council URL to bolt.host
  
  1. Changes
    - Update AI Council program URL to bolt.host deployment
    
  2. Details
    - Changes URL from 'https://a-icouncil.vercel.app/' to 'https://aicouncil.bolt.host/'
*/

-- Update AI Council URL
UPDATE desktop_icons 
SET url = 'https://aicouncil.bolt.host/'
WHERE name = 'AI Council';
