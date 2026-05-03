/*
  # Revoke EXECUTE from Security Definer Functions

  Fixes Supabase security advisories: "Public/Signed-In Users Can Execute SECURITY DEFINER Function"

  ## Changes

  ### Functions revoked from BOTH anon AND authenticated:
  - Internal helper functions not meant to be called via RPC:
    - `is_valid_admin_token` - internal token validation helper
    - `is_admin_user` - internal admin check helper
    - `validate_auth_token_update` - trigger function, not an RPC
    - `update_notepad_timestamp` - trigger function, not an RPC
    - `log_api_key_usage` - called server-side by edge functions only

  ### Functions revoked from authenticated only (anon still needs them):
  - All admin_* functions, secret management, login tracking, widget state, program permissions
    These are called by the app using the anon key + a custom token-based auth system.
    Granting them to `authenticated` (Supabase auth users) is unnecessary.

  ### Functions left with anon EXECUTE (required for app functionality):
  - admin_* functions (token-protected internally, called via anon key)
  - create_auth_token (login flow)
  - record_user_login (login tracking)
  - get_accessible_programs_for_user (program filtering)
  - validate_notepad_password (notepad access)
  - cleanup_expired_tokens / cleanup_expired_auth_tokens (session maintenance)
  - get_login_logs_admin, get_login_frequency_24h, get_api_key_usage_stats_admin
  - upsert_secret, update_secret_by_id, delete_secret_by_id
  - update_user_program_permission, get_user_program_permissions
  - admin_update_widget_state
*/

-- Revoke from both anon and authenticated: internal helpers and trigger functions
REVOKE EXECUTE ON FUNCTION public.is_valid_admin_token(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin_user(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_auth_token_update() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_notepad_timestamp() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_api_key_usage(text, text) FROM anon, authenticated;

-- Revoke from authenticated only: all functions the app calls via anon key
REVOKE EXECUTE ON FUNCTION public.admin_create_folder(text, text, integer, integer, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_create_folder(text, text, integer, integer, uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_delete_icon(text, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_delete_notice(text, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_insert_icon(text, text, text, text, text, text, integer, integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_insert_icon(text, text, text, text, text, text, integer, integer, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_move_icon(text, uuid, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_pin_notice(text, uuid, boolean) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_post_notice(text, text, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_rename_icon(text, uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_update_icon(text, uuid, text, text, text, text, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_update_icon_position(text, uuid, integer, integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_update_widget_state(text, text, integer, integer, integer, integer, boolean) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_auth_tokens() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_tokens() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.create_auth_token(text, text, boolean) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_secret_by_id(text, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_accessible_programs_for_user(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_api_key_usage_stats_admin(text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_login_frequency_24h(text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_login_logs_admin(text, integer, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_program_permissions(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.record_user_login(text, text, text, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_secret_by_id(text, uuid, text, text, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_user_program_permission(uuid, text, boolean) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.upsert_secret(text, text, text, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_notepad_password(text) FROM authenticated;
