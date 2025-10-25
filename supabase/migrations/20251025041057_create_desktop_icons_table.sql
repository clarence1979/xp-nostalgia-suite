/*
  # Create Desktop Icons Storage

  1. New Tables
    - `desktop_icons`
      - `id` (uuid, primary key) - Unique identifier for each icon
      - `name` (text) - Display name of the program
      - `icon` (text) - Emoji or icon identifier
      - `description` (text) - Description of what the program does
      - `url` (text, nullable) - URL the program references (null for system icons)
      - `icon_type` (text) - Type of icon: 'system', 'program', 'theme'
      - `position_x` (integer) - X coordinate on desktop
      - `position_y` (integer) - Y coordinate on desktop
      - `position_x_mobile` (integer, nullable) - X coordinate on mobile
      - `position_y_mobile` (integer, nullable) - Y coordinate on mobile
      - `category` (text, nullable) - Category: 'general', 'teacher', 'secondary', 'primary'
      - `open_behavior` (text) - How to open: 'window', 'new_tab', 'special'
      - `sort_order` (integer) - Order for displaying icons
      - `created_at` (timestamptz) - When icon was created
      - `updated_at` (timestamptz) - When icon was last updated

  2. Security
    - Enable RLS on `desktop_icons` table
    - Allow public read access (anyone can see desktop icons)
    - Only authenticated users can modify icons

  3. Initial Data
    - Insert all existing desktop icons with their current positions
*/

-- Create the desktop_icons table
CREATE TABLE IF NOT EXISTS desktop_icons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text NOT NULL,
  description text NOT NULL DEFAULT '',
  url text,
  icon_type text NOT NULL CHECK (icon_type IN ('system', 'program', 'theme')),
  position_x integer NOT NULL,
  position_y integer NOT NULL,
  position_x_mobile integer,
  position_y_mobile integer,
  category text CHECK (category IN ('general', 'teacher', 'secondary', 'primary')),
  open_behavior text NOT NULL DEFAULT 'window' CHECK (open_behavior IN ('window', 'new_tab', 'special')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE desktop_icons ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read desktop icons (public access)
CREATE POLICY "Anyone can view desktop icons"
  ON desktop_icons
  FOR SELECT
  USING (true);

-- Only authenticated users can insert icons
CREATE POLICY "Authenticated users can insert icons"
  ON desktop_icons
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated users can update icons
CREATE POLICY "Authenticated users can update icons"
  ON desktop_icons
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only authenticated users can delete icons
CREATE POLICY "Authenticated users can delete icons"
  ON desktop_icons
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert system icons
INSERT INTO desktop_icons (name, icon, description, icon_type, position_x, position_y, position_x_mobile, position_y_mobile, open_behavior, sort_order) VALUES
  ('My Computer', 'HardDrive', 'System computer information', 'system', 20, 20, 10, 10, 'special', 1),
  ('My Documents', 'Folder', 'Personal documents folder', 'system', 20, 120, 10, 90, 'special', 2),
  ('Recycle Bin', 'Trash2', 'Deleted files storage', 'system', 20, 220, 10, 170, 'special', 3),
  ('Internet Explorer', 'Globe', 'Web browser', 'system', 20, 320, 10, 250, 'special', 4),
  ('Notepad', 'FileText', 'Text editor with password protection', 'system', 20, 420, 10, 330, 'special', 5),
  ('Visual Studio Code', 'Code', 'Professional code editor', 'system', 20, 520, 10, 410, 'new_tab', 6)
ON CONFLICT DO NOTHING;

-- Insert theme toggle icon
INSERT INTO desktop_icons (name, icon, description, icon_type, position_x, position_y, position_x_mobile, position_y_mobile, open_behavior, sort_order) VALUES
  ('Kali Linux Display', '🐉', 'Switch to Kali Linux theme', 'theme', 20, 620, 10, 490, 'special', 7)
ON CONFLICT DO NOTHING;

-- Insert program icons - General Tools
INSERT INTO desktop_icons (name, icon, description, url, icon_type, category, position_x, position_y, position_x_mobile, position_y_mobile, open_behavior, sort_order) VALUES
  ('AI Note Taker', '📝', 'Takes dictation notes up to 45 minutes and generates study notes in PDF, customized to suit age range of audience', 'https://ai-note-taker-app-1476.bolt.host', 'program', 'general', 140, 20, 95, 10, 'window', 100),
  ('Tool Hub', '🔧', 'Various Tools for File manipulation', 'https://tools.bolt.host', 'program', 'general', 240, 20, 180, 10, 'window', 101)
ON CONFLICT DO NOTHING;

-- Insert program icons - Teacher Tools
INSERT INTO desktop_icons (name, icon, description, url, icon_type, category, position_x, position_y, position_x_mobile, position_y_mobile, open_behavior, sort_order) VALUES
  ('Magic Marker', '✨', 'Allows teachers to upload student assessments (hand-written or digital) and mark it either with a preset marking scheme or generated one. Gives constructive feedback in PDF', 'https://magicmarker.bolt.host', 'program', 'teacher', 140, 120, 95, 90, 'window', 200),
  ('Teacher Scheduler', '📅', 'Helps teachers stay organised by using AI Agents (Beta)', 'https://teacher-scheduler-ai-bb0t.bolt.host', 'program', 'teacher', 240, 120, 180, 90, 'window', 201),
  ('Student Emotion Recognition', '😊', 'Helps recognise student emotions to determine if they are concentrating', 'https://clarence.guru/emo4.html', 'program', 'teacher', 140, 220, 95, 170, 'window', 202),
  ('Quiz Master Pro', '📋', 'Enables teachers to create Quizzes from uploaded PDF, Word or pictures and auto-generate answers. Lockdown mode will be enabled for students to take the quiz. Results are instantly available.', 'https://quizpro.bolt.host', 'program', 'teacher', 240, 220, 180, 170, 'window', 203)
ON CONFLICT DO NOTHING;

-- Insert program icons - Secondary School Subjects
INSERT INTO desktop_icons (name, icon, description, url, icon_type, category, position_x, position_y, position_x_mobile, position_y_mobile, open_behavior, sort_order) VALUES
  ('Pantry Chef', '👨‍🍳', 'Suggests food that you can cook based on what is available in your pantry. Also gives steps and has a grocery list. The Food scientist analyses existing dishes and tells you how to make them.', 'https://chef.bolt.host/', 'program', 'secondary', 140, 320, 95, 250, 'window', 300),
  ('History', '🎭', 'Talk to your favorite historical character. You can upload information or allow it to research information about the character of your choice.', 'https://historical-figure-ai-p08i.bolt.host', 'program', 'secondary', 240, 320, 180, 250, 'window', 301),
  ('Drone Programming', '🚁', 'Flies the Tello Drone via Scratch Blocks, Python and natural speech (voice and typed text)', 'https://drone.teachingtools.dev/', 'program', 'secondary', 140, 420, 95, 330, 'new_tab', 302),
  ('AUSLAN', '👋', 'Australian Sign Language Learning Program', 'https://auslan.bolt.host', 'program', 'secondary', 240, 420, 180, 330, 'window', 303),
  ('Voice to 3D Printing', '🖨️', 'Inputs voice or text to generate an STL for 3D printing', 'https://voice-to-3d-print-ap-9f4m.bolt.host/', 'program', 'secondary', 140, 520, 95, 410, 'window', 304),
  ('Network Route Tracer', '🌐', 'Determines where you are, and does a trace to the target website from your location. Teaches you how the internet works.', 'https://network-route-tracer-r2zo.bolt.host/', 'program', 'secondary', 240, 520, 180, 410, 'window', 305),
  ('Physics Simulator', '⚛️', 'Simulates movements of balls and other objects and draws graphs to explain concepts in physics.', 'https://interactive-3d-physi-3mdg.bolt.host', 'program', 'secondary', 340, 20, 265, 10, 'window', 306),
  ('Tutoring Chatbot', '🤖', 'Students can ask any questions about academic subjects.', 'https://new-chat-kb4v.bolt.host/', 'program', 'secondary', 340, 120, 265, 90, 'window', 307),
  ('Math Genius', '🔢', 'Allow students from Years 7-10 to learn Maths using AI. Customises questions based on student interest and ability.', 'https://advanced-adaptive-ma-gtky.bolt.host/', 'program', 'secondary', 340, 220, 265, 170, 'window', 308),
  ('Code Class', '💻', 'Teaches Coding - teachers can assign coding homework from here.', 'https://new-chat-oj8v.bolt.host', 'program', 'secondary', 340, 320, 265, 250, 'window', 309)
ON CONFLICT DO NOTHING;

-- Insert program icons - Primary School
INSERT INTO desktop_icons (name, icon, description, url, icon_type, category, position_x, position_y, position_x_mobile, position_y_mobile, open_behavior, sort_order) VALUES
  ('Dream Tales', '📚', 'Generates unique stories every time using the age, gender and interest of the child using AI.', 'https://dreamtales-ai-bedtim-jxhc.bolt.host', 'program', 'primary', 340, 420, 265, 330, 'window', 400),
  ('MP3 Player', '🎵', 'Play your favorite music', 'https://mp3.bolt.host/', 'program', 'primary', 340, 520, 265, 410, 'window', 401)
ON CONFLICT DO NOTHING;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_desktop_icons_sort_order ON desktop_icons(sort_order);
CREATE INDEX IF NOT EXISTS idx_desktop_icons_category ON desktop_icons(category);
CREATE INDEX IF NOT EXISTS idx_desktop_icons_icon_type ON desktop_icons(icon_type);