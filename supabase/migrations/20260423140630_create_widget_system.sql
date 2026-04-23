/*
  # Widget System: widget_states and notices tables

  ## New Tables

  ### widget_states
  Stores admin-configured position, size and minimized state for each desktop widget.
  - widget_id: text PK ('weather', 'news', 'notices')
  - x, y: integer pixel coordinates from top-left
  - width, height: integer pixel dimensions
  - minimized: boolean
  - updated_at: timestamp

  ### notices
  Admin-posted notices visible to all users.
  - id: uuid PK
  - title: short heading (optional)
  - content: body text
  - author: username who posted
  - pinned: boolean (pinned notices appear first)
  - created_at, updated_at: timestamps

  ## Security
  - widget_states: anon SELECT; writes via admin RPC only
  - notices: anon SELECT; INSERT/UPDATE/DELETE via admin RPC only
  - All admin RPCs validate token via auth_tokens table + is_admin check

  ## RPC Functions
  1. admin_update_widget_state  - save widget position/size/minimized
  2. admin_post_notice          - create a new notice
  3. admin_delete_notice        - delete a notice by id
  4. admin_pin_notice           - toggle pin on a notice
*/

-- ─── widget_states ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS widget_states (
  widget_id  text        PRIMARY KEY,
  x          integer     NOT NULL DEFAULT 100,
  y          integer     NOT NULL DEFAULT 100,
  width      integer     NOT NULL DEFAULT 300,
  height     integer     NOT NULL DEFAULT 500,
  minimized  boolean     NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE widget_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view widget states"
  ON widget_states FOR SELECT
  TO anon
  USING (true);

-- ─── notices ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notices (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text        NOT NULL DEFAULT '',
  content    text        NOT NULL,
  author     text        NOT NULL,
  pinned     boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view notices"
  ON notices FOR SELECT
  TO anon
  USING (true);

-- ─── RPC: admin_update_widget_state ────────────────────────────────

CREATE OR REPLACE FUNCTION admin_update_widget_state(
  p_token     text,
  p_widget_id text,
  p_x         integer,
  p_y         integer,
  p_width     integer,
  p_height    integer,
  p_minimized boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT is_admin INTO v_is_admin
  FROM auth_tokens
  WHERE token = p_token AND expires_at > now();

  IF v_is_admin IS NULL OR NOT v_is_admin THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  INSERT INTO widget_states (widget_id, x, y, width, height, minimized, updated_at)
  VALUES (p_widget_id, p_x, p_y, p_width, p_height, p_minimized, now())
  ON CONFLICT (widget_id) DO UPDATE SET
    x          = EXCLUDED.x,
    y          = EXCLUDED.y,
    width      = EXCLUDED.width,
    height     = EXCLUDED.height,
    minimized  = EXCLUDED.minimized,
    updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION admin_update_widget_state TO anon;

-- ─── RPC: admin_post_notice ────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_post_notice(
  p_token   text,
  p_title   text,
  p_content text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username text;
  v_is_admin boolean;
  v_id       uuid;
BEGIN
  SELECT al.username, al.is_admin INTO v_username, v_is_admin
  FROM auth_tokens at
  JOIN users_login al ON al.username = at.username
  WHERE at.token = p_token AND at.expires_at > now();

  IF v_username IS NULL OR NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  INSERT INTO notices (title, content, author)
  VALUES (trim(p_title), trim(p_content), v_username)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_post_notice TO anon;

-- ─── RPC: admin_delete_notice ──────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_delete_notice(
  p_token     text,
  p_notice_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT is_admin INTO v_is_admin
  FROM auth_tokens
  WHERE token = p_token AND expires_at > now();

  IF v_is_admin IS NULL OR NOT v_is_admin THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  DELETE FROM notices WHERE id = p_notice_id;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_delete_notice TO anon;

-- ─── RPC: admin_pin_notice ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_pin_notice(
  p_token     text,
  p_notice_id uuid,
  p_pinned    boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT is_admin INTO v_is_admin
  FROM auth_tokens
  WHERE token = p_token AND expires_at > now();

  IF v_is_admin IS NULL OR NOT v_is_admin THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  UPDATE notices
  SET pinned = p_pinned, updated_at = now()
  WHERE id = p_notice_id;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_pin_notice TO anon;
