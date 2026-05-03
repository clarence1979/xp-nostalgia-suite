/*
  # Revoke EXECUTE from PUBLIC on all SECURITY DEFINER functions

  ## Problem
  Revoking from `anon` and `authenticated` individually does not work because
  PostgreSQL grants EXECUTE to `PUBLIC` by default when functions are created,
  and all roles (including anon/authenticated) inherit from PUBLIC.
  The correct fix is to revoke from PUBLIC directly.

  ## Changes
  Revokes EXECUTE from PUBLIC on all flagged SECURITY DEFINER functions.
  Then re-grants EXECUTE to anon only for functions the app calls client-side.

  ## Functions that remain callable by anon (app requires them):
  - create_auth_token: login flow
  - record_user_login: login tracking
  - get_accessible_programs_for_user: program access filtering
  - validate_notepad_password: notepad access
  - cleanup_expired_tokens / cleanup_expired_auth_tokens: session maintenance
  - admin_* functions: protected internally by token validation
  - get_login_logs_admin, get_login_frequency_24h, get_api_key_usage_stats_admin
  - upsert_secret, update_secret_by_id, delete_secret_by_id
  - update_user_program_permission, get_user_program_permissions
  - admin_update_widget_state
  - log_api_key_usage: called by edge functions via anon key

  ## Functions revoked entirely (trigger functions / internal helpers):
  - is_valid_admin_token, is_admin_user: internal helpers, not RPC endpoints
  - validate_auth_token_update, update_notepad_timestamp: trigger functions
*/

-- Step 1: Revoke from PUBLIC for all flagged functions
REVOKE EXECUTE ON FUNCTION public.admin_create_folder(text, text, integer, integer, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_create_folder(text, text, integer, integer, uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_icon(text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_notice(text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_insert_icon(text, text, text, text, text, text, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_insert_icon(text, text, text, text, text, text, integer, integer, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_move_icon(text, uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_pin_notice(text, uuid, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_post_notice(text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_rename_icon(text, uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_icon(text, uuid, text, text, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_icon_position(text, uuid, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_widget_state(text, text, integer, integer, integer, integer, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_auth_tokens() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_tokens() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_auth_token(text, text, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_secret_by_id(text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_accessible_programs_for_user(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_api_key_usage_stats_admin(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_login_frequency_24h(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_login_logs_admin(text, integer, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_program_permissions(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin_user(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_valid_admin_token(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_api_key_usage(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_user_login(text, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_notepad_timestamp() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_secret_by_id(text, uuid, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_user_program_permission(uuid, text, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.upsert_secret(text, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_auth_token_update() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_notepad_password(text) FROM PUBLIC;

-- Step 2: Re-grant to anon only for functions the app calls client-side
-- (internal helpers and trigger functions are NOT re-granted)
GRANT EXECUTE ON FUNCTION public.admin_create_folder(text, text, integer, integer, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_create_folder(text, text, integer, integer, uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_icon(text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_notice(text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_insert_icon(text, text, text, text, text, text, integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_insert_icon(text, text, text, text, text, text, integer, integer, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_move_icon(text, uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_pin_notice(text, uuid, boolean) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_post_notice(text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_rename_icon(text, uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_update_icon(text, uuid, text, text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_update_icon_position(text, uuid, integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_update_widget_state(text, text, integer, integer, integer, integer, boolean) TO anon;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_auth_tokens() TO anon;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_tokens() TO anon;
GRANT EXECUTE ON FUNCTION public.create_auth_token(text, text, boolean) TO anon;
GRANT EXECUTE ON FUNCTION public.delete_secret_by_id(text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_accessible_programs_for_user(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_api_key_usage_stats_admin(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_login_frequency_24h(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_login_logs_admin(text, integer, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_program_permissions(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.log_api_key_usage(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.record_user_login(text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.update_secret_by_id(text, uuid, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.update_user_program_permission(uuid, text, boolean) TO anon;
GRANT EXECUTE ON FUNCTION public.upsert_secret(text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_notepad_password(text) TO anon;
