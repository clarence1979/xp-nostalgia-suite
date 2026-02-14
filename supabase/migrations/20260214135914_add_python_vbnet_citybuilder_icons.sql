/*
  # Add Python IDE, VB.NET IDE, and City Builder Game Icons

  1. New Desktop Icons
    - Python IDE (https://program.bolt.host)
      - Position: (20, 620)
      - Icon: 🐍
      - Description: Write and execute Python programs easily
    
    - VB.NET Web Visual IDE (https://vbnet.bolt.host)
      - Position: (140, 620)
      - Icon: 💠
      - Description: Visual Basic on the Net
    
    - City Builder Game (https://city.bolt.host)
      - Position: (240, 620)
      - Icon: 🏙️
      - Description: Build your 3D City and upload models into it

  These icons provide access to programming environments and a 3D city building game.
*/

INSERT INTO desktop_icons (name, icon, icon_type, position_x, position_y, url, description)
VALUES 
  (
    'Python IDE',
    '🐍',
    'program',
    20,
    620,
    'https://program.bolt.host',
    'Write and execute Python programs easily'
  ),
  (
    'VB.NET Web Visual IDE',
    '💠',
    'program',
    140,
    620,
    'https://vbnet.bolt.host',
    'Visual Basic on the Net'
  ),
  (
    'City Builder Game',
    '🏙️',
    'program',
    240,
    620,
    'https://city.bolt.host',
    'Build your 3D City and upload models into it'
  )
ON CONFLICT DO NOTHING;
