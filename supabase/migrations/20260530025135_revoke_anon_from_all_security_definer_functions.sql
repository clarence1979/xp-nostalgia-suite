/*
  # Revoke anon EXECUTE from all SECURITY DEFINER functions

  ## Summary
  All privileged DB functions are now called exclusively through the `admin-rpc`
  Edge Function, which uses the service_role key and therefore bypasses grants
  entirely. There is no longer any need for `anon` to have direct EXECUTE access
  on these functions. Revoking closes the "Public Can Execute SECURITY DEFINER
  Function" advisory for every function listed below.

  ## Functions affected (25 total)
  - admin_create_folder (both overloads)
  - admin_delete_icon
  - admin_delete_notice
  - admin_insert_icon (both overloads)
  - admin_move_icon
  - admin_pin_notice
  - admin_post_notice
  - admin_rename_icon
  - admin_update_icon
  - admin_update_icon_position
  - admin_update_widget_state
  - create_auth_token
  - delete_secret_by_id
  - get_accessible_programs_for_user
  - get_api_key_usage_stats_admin
  - get_login_frequency_24h
  - get_login_logs_admin
  - get_user_program_permissions
  - record_user_login
  - update_secret_by_id
  - update_user_program_permission
  - upsert_secret
  - validate_notepad_password

  ## Security model after this migration
  - anon / public: CANNOT call any of these functions via REST API
  - authenticated:  CANNOT call any of these functions via REST API
  - service_role:   CAN call all functions (bypasses grants) — used by admin-rpc edge function
*/

REVOKE EXECUTE ON FUNCTION public.admin_create_folder(text, text, integer, integer, uuid)                             FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_create_folder(text, text, integer, integer, uuid, text)                       FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_icon(text, uuid)                                                       FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_notice(text, uuid)                                                     FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_insert_icon(text, text, text, text, text, text, integer, integer)             FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_insert_icon(text, text, text, text, text, text, integer, integer, uuid)       FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_move_icon(text, uuid, uuid)                                                   FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_pin_notice(text, uuid, boolean)                                               FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_post_notice(text, text, text)                                                 FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_rename_icon(text, uuid, text)                                                 FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_icon(text, uuid, text, text, text, text, text)                         FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_icon_position(text, uuid, integer, integer)                            FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_widget_state(text, text, integer, integer, integer, integer, boolean)  FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_auth_token(text, text, boolean)                                             FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_secret_by_id(text, uuid)                                                    FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_accessible_programs_for_user(uuid)                                             FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_api_key_usage_stats_admin(text)                                                FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_login_frequency_24h(text)                                                      FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_login_logs_admin(text, integer, text)                                          FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_program_permissions(text, uuid)                                           FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_user_login(text, text, text, text)                                          FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_secret_by_id(text, uuid, text, text, text)                                  FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_user_program_permission(text, uuid, text, boolean)                          FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.upsert_secret(text, text, text, text)                                              FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_notepad_password(text)                                                    FROM anon, authenticated, PUBLIC;
