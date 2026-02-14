# Comprehensive Security Fixes - February 14, 2026

## Issues Fixed

### 1. Unindexed Foreign Key
**Issue:** Table `desktop_icons` had a foreign key `desktop_icons_user_id_fkey` without a covering index, causing suboptimal query performance.

**Fix:** Added index `idx_desktop_icons_user_id` on the `user_id` column.

```sql
CREATE INDEX idx_desktop_icons_user_id ON desktop_icons(user_id);
```

### 2. Auth RLS Initialization Plan Issues
**Issue:** Table `secrets` had RLS policies that re-evaluated `current_setting()` for each row, producing suboptimal query performance.

**Fix:** Updated all admin policies on the `secrets` table to use the `(SELECT ...)` pattern:
- `Allow admin to insert secrets`
- `Allow admin to update secrets`
- `Allow admin to delete secrets`

```sql
-- Example: Before
WHERE username = current_setting('request.jwt.claims', true)::json->>'username'

-- Example: After
WHERE username = (SELECT current_setting('request.jwt.claims', true)::json->>'username')
```

### 3. Multiple Permissive Policies
**Issue:** Table `desktop_icons` had multiple permissive policies for the same operations, causing conflicts:
- INSERT: "Allow RPC to insert desktop icons" + "Users can insert own icons"
- UPDATE: "Allow RPC to update desktop icons" + "Users can update own icons"
- DELETE: "Allow RPC to delete desktop icons" + "Users can delete own icons"

**Fix:** Removed the overly permissive RPC policies. Admin operations now use SECURITY DEFINER functions that bypass RLS entirely, while regular users use the restrictive user-owned policies.

### 4. RLS Policy Always True
**Issue:** Three policies on `desktop_icons` had USING/WITH CHECK clauses set to `true`, effectively bypassing RLS:
- "Allow RPC to insert desktop icons"
- "Allow RPC to update desktop icons"
- "Allow RPC to delete desktop icons"

**Fix:** Removed these policies. RPC functions now use SECURITY DEFINER to bypass RLS securely while performing their own authorization checks.

### 5. Function Search Path Mutable
**Issue:** Five functions had role-mutable search_path, creating SQL injection vulnerabilities:
- `is_valid_admin_token`
- `admin_update_icon_position`
- `admin_delete_icon`
- `admin_insert_icon`
- `admin_update_icon`

**Fix:** Added `SET search_path = public` to all functions to prevent search path manipulation attacks.

```sql
CREATE OR REPLACE FUNCTION admin_delete_icon(...)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- Added this
AS $$
...
$$;
```

### 6. Auth DB Connection Strategy
**Issue:** Auth server configured to use fixed 10 connections instead of percentage-based allocation.

**Status:** This is a Supabase project configuration setting that cannot be fixed via migrations. Must be adjusted in the Supabase dashboard under Settings > Database > Connection Pooling.

## Current Security Posture

### Desktop Icons Table
- **SELECT**: Public access (anyone can view)
- **INSERT**: Authenticated users can insert their own icons (validated by user_id)
- **UPDATE**: Authenticated users can update their own icons (validated by user_id)
- **DELETE**: Authenticated users can delete their own icons (validated by user_id)
- **Admin Operations**: Use SECURITY DEFINER RPC functions with token validation

### Secrets Table
- **SELECT**: Only users who own the secret (via username match)
- **INSERT/UPDATE/DELETE**: Admin users only (validated via optimized RLS)

### Auth Tokens Table
- **SELECT**: Users can read their own tokens
- **INSERT**: RPC function with admin validation
- **UPDATE**: Users can update last_used_at on their own tokens
- **DELETE**: Admin users only

## Performance Improvements
- Foreign key index on `desktop_icons.user_id` improves join performance
- Optimized RLS policies on `secrets` table reduce per-row overhead
- Fixed search paths prevent unnecessary schema lookups

## Security Improvements
- Eliminated overly permissive RLS policies
- Fixed SQL injection vulnerabilities in functions
- Maintained proper authorization boundaries
- All admin operations now go through secure RPC functions
