/*
  # Add must_change_password column and insert new student users

  1. Changes to users_login
    - Add `must_change_password` (boolean, default false) column
      - When true, the user is forced to change their password immediately after login
      - Set to true for all newly created users so they must set a personal password on first login

  2. New Users (27 students)
    - All created with default password: 12345678
    - All have must_change_password = true so they must change password on first login
    - All have is_admin = false
    - Usernames: kiisi, elise, olivia, annabel, ashton, isaiah, reggie, isaac, aaveer,
      jeriel, ethan, jake, niamh, sidh, hamish, arnavc, ruibin, jackson, lucas, anthony,
      ethanc, calvin, riley, matthew, matari, tyson, dineth
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users_login' AND column_name = 'must_change_password'
  ) THEN
    ALTER TABLE users_login ADD COLUMN must_change_password boolean NOT NULL DEFAULT false;
  END IF;
END $$;

INSERT INTO users_login (username, password, is_admin, must_change_password)
VALUES
  ('kiisi',    '12345678', false, true),
  ('elise',    '12345678', false, true),
  ('olivia',   '12345678', false, true),
  ('annabel',  '12345678', false, true),
  ('ashton',   '12345678', false, true),
  ('isaiah',   '12345678', false, true),
  ('reggie',   '12345678', false, true),
  ('isaac',    '12345678', false, true),
  ('aaveer',   '12345678', false, true),
  ('jeriel',   '12345678', false, true),
  ('ethan',    '12345678', false, true),
  ('jake',     '12345678', false, true),
  ('niamh',    '12345678', false, true),
  ('sidh',     '12345678', false, true),
  ('hamish',   '12345678', false, true),
  ('arnavc',   '12345678', false, true),
  ('ruibin',   '12345678', false, true),
  ('jackson',  '12345678', false, true),
  ('lucas',    '12345678', false, true),
  ('anthony',  '12345678', false, true),
  ('ethanc',   '12345678', false, true),
  ('calvin',   '12345678', false, true),
  ('riley',    '12345678', false, true),
  ('matthew',  '12345678', false, true),
  ('matari',   '12345678', false, true),
  ('tyson',    '12345678', false, true),
  ('dineth',   '12345678', false, true)
ON CONFLICT (username) DO NOTHING;
