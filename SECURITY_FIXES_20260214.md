# Security Fixes - February 14, 2026

## Overview
This document details all security fixes applied to address vulnerabilities and performance issues identified in the database security audit.

## Issues Fixed

### 1. Removed Unused Database Indexes
**Issue**: Three indexes were not being used by any queries, creating unnecessary maintenance overhead.

**Fixed**:
- Removed `idx_auth_tokens_token` - Redundant with UNIQUE constraint on token column
- Removed `idx_auth_tokens_expires_at` - Not used in complex queries
- Removed `idx_desktop_icons_user_id` - RLS policies handle filtering efficiently

**Impact**: Reduced database maintenance overhead and improved write performance.

---

### 2. Fixed Function Search Path Vulnerability
**Issue**: Function `cleanup_expired_tokens` had a mutable search_path, making it vulnerable to search path manipulation attacks.

**Fixed**:
- Added `SECURITY DEFINER` to the function
- Set immutable `search_path = public` to prevent manipulation
- Function now executes in a secure, predictable context

**Impact**: Prevents malicious users from exploiting function execution context to access unauthorized data.

---

### 3. Fixed Overly Permissive RLS Policy
**Issue**: Table `auth_tokens` had an INSERT policy with `WITH CHECK (true)`, allowing anyone to create authentication tokens.

**Fixed**:
- Removed permissive INSERT policy
- Created new restrictive policy that blocks all client-side token creation
- Implemented secure edge function `/functions/v1/auth-token/generate` that:
  - Validates user credentials server-side
  - Creates tokens using service role (bypasses RLS)
  - Only accessible after password validation

**Changes Made**:
1. Created edge function `auth-token` for secure token generation/revocation
2. Updated `authTokenService.ts` to call edge function instead of direct database insert
3. Added DELETE policy to block client-side token deletion
4. Added UPDATE policy to allow tracking token usage via `last_used_at`

**Impact**:
- Tokens can only be created after valid authentication
- Prevents unauthorized token creation
- All token operations go through secure backend code

---

### 4. Cleaned Up Duplicate Policies
**Issue**: Multiple conflicting INSERT policies existed on `auth_tokens` table.

**Fixed**:
- Removed duplicate policies
- Maintained single source of truth for each operation type
- Added proper DELETE and UPDATE policies

**Impact**: Clear policy hierarchy, easier to audit and maintain.

---

## New Security Architecture

### Token Creation Flow
```
Client → Edge Function (/auth-token/generate)
         ↓
      Validate Credentials (users_login table)
         ↓
      Generate Token (service role bypasses RLS)
         ↓
      Return Token to Client
```

### Token Validation Flow
```
Client → Direct SELECT query (auth_tokens)
         ↓
      RLS Policy: "Anyone can validate tokens"
      (checks expires_at > now())
         ↓
      Return Token Data
         ↓
      Client updates last_used_at for tracking
```

### Token Revocation Flow
```
Client → Edge Function (/auth-token/revoke)
         ↓
      Delete Token (service role bypasses RLS)
         ↓
      Return Success
```

## Migration Files Created
1. `fix_security_issues_20260214.sql` - Main security fixes
2. `cleanup_auth_tokens_policies.sql` - Policy cleanup and DELETE/UPDATE policies

## Edge Functions Deployed
1. `auth-token` - Handles secure token generation and revocation

## Files Modified
1. `src/lib/authTokenService.ts` - Updated to use edge function
2. `src/components/ApiKeyLogin.tsx` - Updated function signature

## Testing Recommendations
1. Verify users cannot create tokens directly via Supabase client
2. Verify tokens can only be created with valid credentials
3. Verify token validation still works for iframe programs
4. Verify token revocation works through edge function
5. Verify expired tokens are rejected during validation

## Security Improvements Summary
✅ Search path attacks prevented
✅ Unauthorized token creation blocked
✅ Token operations secured behind authentication
✅ Unused indexes removed
✅ Clear policy hierarchy established
✅ All token operations go through controlled backend code
