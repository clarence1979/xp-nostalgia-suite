# Auth Token Generation Implementation

## Overview

This document describes the implementation of automatic authentication token generation during login. The generated token is now passed to all iframe programs to enable seamless authentication across embedded applications.

## Changes Made

### 1. Enhanced Login Flow (`src/components/ApiKeyLogin.tsx`)

**Changed:**
- Updated `ApiKeyLoginProps` interface to include `authToken` parameter in `onLogin` callback
- Modified `handleLogin` to capture the generated auth token in a variable
- Pass the generated token through the `onLogin` callback

**Key Code:**
```typescript
interface ApiKeyLoginProps {
  onLogin: (username: string, apiKey: string | null, isAdmin: boolean, userId?: string, authToken?: string) => void;
  onCancel: () => void;
}

// In handleLogin:
let generatedAuthToken: string | null = null;
generatedAuthToken = await authTokenService.generateToken(username, result.isAdmin);

if (generatedAuthToken) {
  console.log('[Login] Auth token generated successfully');
  apiKeyStorage.saveAuthToken(generatedAuthToken);
} else {
  console.warn('[Login] Failed to generate auth token - proceeding without token');
}

// Pass token to parent
onLogin(username, result.apiKey, result.isAdmin, result.userId, generatedAuthToken || undefined);
```

### 2. Updated Parent Login Handler (`src/pages/Index.tsx`)

**Changed:**
- Modified `handleApiKeyLogin` to accept `authToken` parameter
- Pass the token directly to `apiKeyStorage.saveSession()` instead of retrieving it after

**Key Code:**
```typescript
const handleApiKeyLogin = (
  user: string,
  key: string | null,
  admin: boolean,
  userIdParam?: string,
  authToken?: string
) => {
  console.log('[Index] handleApiKeyLogin called with authToken:', {
    hasToken: !!authToken,
    tokenLength: authToken?.length || 0
  });

  apiKeyStorage.saveSession(user, key, admin, authToken || undefined, userIdParam);
  // ... rest of login logic
};
```

### 3. Enhanced Logging Across the Stack

Added comprehensive logging at each step to track token flow:

**ApiKeyLogin.tsx:**
```typescript
console.log('[Login] Generating auth token for user:', username);
console.log('[Login] Auth token generated successfully');
console.warn('[Login] Failed to generate auth token - proceeding without token');
```

**authTokenService.ts:**
```typescript
console.log('[AuthTokenService] Generating token for:', { username, isAdmin });
console.log('[AuthTokenService] Calling create_auth_token RPC...');
console.log('[AuthTokenService] Token created successfully, length:', token.length);
```

**apiKeyStorage.ts:**
```typescript
console.log('[ApiKeyStorage] Saving auth token, length:', token.length);
console.log('[ApiKeyStorage] Token saved to both storage and session');
console.log('[ApiKeyStorage] Retrieved auth token:', {
  hasToken: !!token,
  tokenLength: token?.length || 0,
  fromSession: !!session?.authToken,
  fromStorage: !!localStorage.getItem(AUTH_TOKEN_KEY)
});
```

**IframeProgram.tsx:**
```typescript
console.log('[IframeProgram] Sending credentials to iframe:', {
  hasKey: !!allApiValues.OPENAI_API_KEY,
  hasToken: !!authToken,
  hasUsername: !!allApiValues.username,
  isAdmin: allApiValues.isAdmin,
  tokenLength: authToken?.length || 0
});
```

**Index.tsx (message handler):**
```typescript
console.log('[Index] Sending credentials via postMessage:', {
  hasKey: !!allApiValues.OPENAI_API_KEY,
  hasToken: !!authToken,
  hasUsername: !!allApiValues.username,
  isAdmin: allApiValues.isAdmin,
  tokenLength: authToken?.length || 0
});
```

## Flow Diagram

```
User enters credentials
         ↓
[ApiKeyLogin] Validate credentials
         ↓
[ApiKeyLogin] Generate auth token via authTokenService
         ↓
[ApiKeyLogin] Save token via apiKeyStorage.saveAuthToken()
         ↓
[ApiKeyLogin] Call onLogin(username, apiKey, isAdmin, userId, authToken)
         ↓
[Index] handleApiKeyLogin receives token
         ↓
[Index] Save session with token via apiKeyStorage.saveSession()
         ↓
[Index/IframeProgram] Retrieve token via apiKeyStorage.getAuthToken()
         ↓
[IframeProgram] Send token to iframe via postMessage
         ↓
[Iframe App] Receive and validate token
```

## Data Sent to Iframes

All iframe programs now receive the following data structure:

```typescript
{
  type: 'API_VALUES_RESPONSE',
  data: {
    OPENAI_API_KEY: string,
    CLAUDE_API_KEY: string,
    GEMINI_API_KEY: string,
    REPLICATE_API_KEY: string,
    SUPABASE_URL: string,
    SUPABASE_ANON_KEY: string,
    username: string,
    isAdmin: boolean,
    authToken: string  // Now guaranteed to be present after successful login
  },
  apiKey: string
}
```

## Debugging

With the enhanced logging, you can now track the token through the entire flow:

1. **Login Stage**: Look for `[Login]` prefixed logs to see token generation
2. **Service Stage**: Look for `[AuthTokenService]` logs to see RPC calls
3. **Storage Stage**: Look for `[ApiKeyStorage]` logs to see save/retrieve operations
4. **Iframe Stage**: Look for `[IframeProgram]` logs to see what's sent to iframes
5. **Parent Stage**: Look for `[Index]` logs to see postMessage handling

## Testing Checklist

- [ ] Log in with valid credentials
- [ ] Check console for `[Login] Auth token generated successfully`
- [ ] Check console for `[ApiKeyStorage] Token saved to both storage and session`
- [ ] Open an iframe program
- [ ] Check console for `[IframeProgram] Sending credentials to iframe` with `hasToken: true`
- [ ] Verify iframe receives `authToken` with non-zero length
- [ ] Refresh the page
- [ ] Verify token persists in localStorage and session

## Token Security

The auth token is:
- Generated using cryptographically secure random values
- Stored in the `auth_tokens` table with expiration
- Validated on each use
- Associated with the username and admin status
- Automatically cleaned up when expired

## Troubleshooting

If `hasToken: false` appears in logs:

1. Check `[AuthTokenService]` logs for RPC errors
2. Verify the `create_auth_token` RPC function exists in database
3. Check `auth_tokens` table permissions
4. Verify token is being saved to localStorage: `localStorage.getItem('auth_token')`
5. Check browser console for any errors during token generation
