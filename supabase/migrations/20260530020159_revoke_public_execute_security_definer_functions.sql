/*
  # Revoke PUBLIC EXECUTE on all SECURITY DEFINER functions

  ## Problem
  All SECURITY DEFINER functions were implicitly executable by `anon` via the
  PUBLIC grant, exposing them through /rest/v1/rpc/ to unauthenticated callers.

  ## Fix
  1. Revoke EXECUTE from PUBLIC on every flagged function.
  2. Re-grant EXECUTE to `anon` only for functions the frontend calls directly
     using the anon key.
  3. Functions used exclusively by edge functions (which use SUPABASE_SERVICE_ROLE_KEY
     and bypass grants entirely) are NOT re-granted to anon:
       - create_auth_token          (auth-token edge function)
       - log_api_key_usage          (openai/gemini/anthropic-proxy edge functions)
       - validate_notepad_password  (notepad edge function)
       - cleanup_expired_auth_tokens / cleanup_expired_tokens  (maintenance)
*/

-- ============================================================
-- Revoke from PUBLIC
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.admin_create_folder(text, text, integer, integer, uuid)                               FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_create_folder(text, text, integer, integer, uuid, text)                         FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_icon(text, uuid)                                                         FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_notice(text, uuid)                                                       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_insert_icon(text, text, text, text, text, text, integer, integer)               FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_insert_icon(text, text, text, text, text, text, integer, integer, uuid)         FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_move_icon(text, uuid, uuid)                                                     FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_pin_notice(text, uuid, boolean)                                                 FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_post_notice(text, text, text)                                                   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_rename_icon(text, uuid, text)                                                   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_icon(text, uuid, text, text, text, text, text)                           FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_icon_position(text, uuid, integer, integer)                              FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_widget_state(text, text, integer, integer, integer, integer, boolean)    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_auth_tokens()                                                         FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_tokens()                                                              FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_auth_token(text, text, boolean)                                               FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_secret_by_id(text, uuid)                                                      FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_accessible_programs_for_user(uuid)                                               FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_api_key_usage_stats_admin(text)                                                  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_login_frequency_24h(text)                                                        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_login_logs_admin(text, integer, text)                                            FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_program_permissions(text, uuid)                                             FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_api_key_usage(text, text)                                                        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_user_login(text, text, text, text)                                            FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_secret_by_id(text, uuid, text, text, text)                                    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_user_program_permission(text, uuid, text, boolean)                            FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.upsert_secret(text, text, text, text)                                                FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_notepad_password(text)                                                      FROM PUBLIC;

-- ============================================================
-- Re-grant to `anon` for frontend-callable functions only
-- ============================================================

-- Desktop icon management (desktopIconService.ts)
GRANT EXECUTE ON FUNCTION public.admin_create_folder(text, text, integer, integer, uuid)                               TO anon;
GRANT EXECUTE ON FUNCTION public.admin_create_folder(text, text, integer, integer, uuid, text)                         TO anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_icon(text, uuid)                                                         TO anon;
GRANT EXECUTE ON FUNCTION public.admin_insert_icon(text, text, text, text, text, text, integer, integer)               TO anon;
GRANT EXECUTE ON FUNCTION public.admin_insert_icon(text, text, text, text, text, text, integer, integer, uuid)         TO anon;
GRANT EXECUTE ON FUNCTION public.admin_move_icon(text, uuid, uuid)                                                     TO anon;
GRANT EXECUTE ON FUNCTION public.admin_rename_icon(text, uuid, text)                                                   TO anon;
GRANT EXECUTE ON FUNCTION public.admin_update_icon(text, uuid, text, text, text, text, text)                           TO anon;
GRANT EXECUTE ON FUNCTION public.admin_update_icon_position(text, uuid, integer, integer)                              TO anon;

-- Notices (NoticesWidget.tsx)
GRANT EXECUTE ON FUNCTION public.admin_delete_notice(text, uuid)                                                       TO anon;
GRANT EXECUTE ON FUNCTION public.admin_pin_notice(text, uuid, boolean)                                                 TO anon;
GRANT EXECUTE ON FUNCTION public.admin_post_notice(text, text, text)                                                   TO anon;

-- Widget state (WidgetContainer.tsx)
GRANT EXECUTE ON FUNCTION public.admin_update_widget_state(text, text, integer, integer, integer, integer, boolean)    TO anon;

-- Secrets / API key management (UserManagement.tsx)
GRANT EXECUTE ON FUNCTION public.delete_secret_by_id(text, uuid)                                                      TO anon;
GRANT EXECUTE ON FUNCTION public.get_api_key_usage_stats_admin(text)                                                  TO anon;
GRANT EXECUTE ON FUNCTION public.update_secret_by_id(text, uuid, text, text, text)                                    TO anon;
GRANT EXECUTE ON FUNCTION public.upsert_secret(text, text, text, text)                                                TO anon;

-- Program permissions (Index.tsx + UserManagement.tsx)
GRANT EXECUTE ON FUNCTION public.get_accessible_programs_for_user(uuid)                                               TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_program_permissions(text, uuid)                                             TO anon;
GRANT EXECUTE ON FUNCTION public.update_user_program_permission(text, uuid, text, boolean)                            TO anon;

-- Login logs (UserManagement.tsx)
GRANT EXECUTE ON FUNCTION public.get_login_frequency_24h(text)                                                        TO anon;
GRANT EXECUTE ON FUNCTION public.get_login_logs_admin(text, integer, text)                                            TO anon;

-- Login event recording (loginLogger.ts — called directly from the frontend)
GRANT EXECUTE ON FUNCTION public.record_user_login(text, text, text, text)                                            TO anon;
