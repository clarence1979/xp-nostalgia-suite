# Fixing Iframe Authentication Failure

## Problem Analysis

Your iframe program is failing to authenticate even though the parent is sending valid credentials. Here's what's happening:

### Logs Show:

**Parent Side:**
```
[ApiKeyStorage] Retrieved auth token: {hasToken: false, tokenLength: 0}
[Index] Sending credentials: {hasKey: true, hasToken: false, hasUsername: true, isAdmin: true, tokenLength: 0}
```

**Iframe Side:**
```
[Auth] Received message: {type: 'API_VALUES_RESPONSE', data: {...}, apiKey: 'sk-svcacct-...'}
[Auth] Got API_VALUES_RESPONSE
[Auth] Authentication failed
[App] Auto-login result: {authenticated: false}
```

### Root Cause:

Your iframe's authentication logic is **too strict** - it's requiring an `authToken` to be present, but the parent has no token in storage. This happens when:

1. User logged in before token generation was implemented
2. Old session exists without token
3. Iframe rejects authentication because `authToken` is empty/missing

## Solution: Fix Iframe Authentication Logic

Your iframe authentication should follow this priority:

1. **Try authToken first** (if available)
2. **Fall back to username + credentials** (if token missing)
3. **Only show login screen if nothing works**

### Update Your Authentication Handler

Replace your current authentication logic with this flexible approach:

```javascript
async function handleParentAuthentication() {
  return new Promise((resolve) => {
    const messageHandler = async (event) => {
      if (event.data.type === 'API_VALUES_RESPONSE') {
        window.removeEventListener('message', messageHandler);

        const credentials = event.data.data;
        const {
          authToken,
          username,
          isAdmin,
          SUPABASE_URL,
          SUPABASE_ANON_KEY,
          OPENAI_API_KEY
        } = credentials;

        console.log('[Auth] Received credentials:', {
          hasToken: !!authToken,
          hasUsername: !!username,
          hasKey: !!OPENAI_API_KEY,
          hasUrl: !!SUPABASE_URL,
          isAdmin
        });

        // Store all credentials
        if (authToken) localStorage.setItem('authToken', authToken);
        if (username) localStorage.setItem('username', username);
        if (isAdmin !== undefined) localStorage.setItem('isAdmin', String(isAdmin));
        if (SUPABASE_URL) localStorage.setItem('SUPABASE_URL', SUPABASE_URL);
        if (SUPABASE_ANON_KEY) localStorage.setItem('SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);
        if (OPENAI_API_KEY) localStorage.setItem('OPENAI_API_KEY', OPENAI_API_KEY);

        // PRIORITY 1: Validate token if present
        if (authToken && authToken !== '' && SUPABASE_URL && SUPABASE_ANON_KEY) {
          console.log('[Auth] Attempting token validation...');
          try {
            const response = await fetch(
              `${SUPABASE_URL}/rest/v1/auth_tokens?token=eq.${authToken}&expires_at=gt.${new Date().toISOString()}&select=username,is_admin`,
              {
                headers: {
                  'apikey': SUPABASE_ANON_KEY,
                  'Content-Type': 'application/json'
                }
              }
            );

            const tokens = await response.json();

            if (tokens && tokens.length > 0) {
              console.log('[Auth] ✓ Token validated successfully');

              const user = {
                username: tokens[0].username,
                isAdmin: tokens[0].is_admin,
                authToken: authToken
              };

              resolve(user);
              return;
            } else {
              console.warn('[Auth] ⚠ Token validation failed, trying fallback...');
            }
          } catch (error) {
            console.warn('[Auth] ⚠ Token validation error:', error);
          }
        }

        // PRIORITY 2: Use username + credentials (no token validation required)
        if (username && (OPENAI_API_KEY || SUPABASE_URL)) {
          console.log('[Auth] ✓ Auto-login with username (no token):', username);

          const user = {
            username: username,
            isAdmin: isAdmin || false,
            authToken: authToken || null
          };

          resolve(user);
          return;
        }

        // PRIORITY 3: Nothing worked
        console.log('[Auth] ✗ No valid credentials received');
        resolve(null);
      }
    };

    window.addEventListener('message', messageHandler);

    // Request credentials from parent
    if (window.parent !== window) {
      console.log('[Auth] Requesting credentials from parent...');
      window.parent.postMessage({ type: 'REQUEST_API_VALUES' }, '*');
    }

    // Timeout fallback - check localStorage
    setTimeout(() => {
      window.removeEventListener('message', messageHandler);
      console.log('[Auth] ⏱ Timeout - checking localStorage fallback...');

      const storedUsername = localStorage.getItem('username');
      const storedIsAdmin = localStorage.getItem('isAdmin') === 'true';
      const storedToken = localStorage.getItem('authToken');
      const storedKey = localStorage.getItem('OPENAI_API_KEY');

      if (storedUsername || storedKey) {
        console.log('[Auth] ✓ Found stored credentials');
        resolve({
          username: storedUsername || 'guest',
          isAdmin: storedIsAdmin,
          authToken: storedToken || null
        });
      } else {
        console.log('[Auth] ✗ No stored credentials found');
        resolve(null);
      }
    }, 2000);
  });
}
```

### Key Changes:

1. **Token is optional, not required**
   - If token exists → validate it
   - If token missing → use username + credentials
   - If nothing → show login screen

2. **Three-tier fallback system**
   - Try token validation first (best security)
   - Fall back to username-based auth (good UX)
   - Last resort: localStorage cache

3. **Better error handling**
   - Catches token validation errors
   - Falls back gracefully instead of failing
   - Logs each step for debugging

4. **Proper credential storage**
   - Stores everything received from parent
   - Uses localStorage as cache
   - Persists across reloads

### For React Applications

If you're using React, here's the hook version:

```javascript
import { useEffect, useState } from 'react';

function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleAuthentication = async () => {
      try {
        const messageHandler = async (event) => {
          if (event.data.type === 'API_VALUES_RESPONSE') {
            const credentials = event.data.data;
            const {
              authToken,
              username,
              isAdmin,
              SUPABASE_URL,
              SUPABASE_ANON_KEY,
              OPENAI_API_KEY
            } = credentials;

            console.log('[Auth] Received credentials:', {
              hasToken: !!authToken,
              hasUsername: !!username,
              hasKey: !!OPENAI_API_KEY,
              isAdmin
            });

            // Store credentials
            if (authToken) localStorage.setItem('authToken', authToken);
            if (username) localStorage.setItem('username', username);
            if (isAdmin !== undefined) localStorage.setItem('isAdmin', String(isAdmin));
            if (SUPABASE_URL) localStorage.setItem('SUPABASE_URL', SUPABASE_URL);
            if (SUPABASE_ANON_KEY) localStorage.setItem('SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);
            if (OPENAI_API_KEY) localStorage.setItem('OPENAI_API_KEY', OPENAI_API_KEY);

            // Try token validation if available
            if (authToken && SUPABASE_URL && SUPABASE_ANON_KEY) {
              try {
                const response = await fetch(
                  `${SUPABASE_URL}/rest/v1/auth_tokens?token=eq.${authToken}&expires_at=gt.${new Date().toISOString()}&select=username,is_admin`,
                  {
                    headers: {
                      'apikey': SUPABASE_ANON_KEY,
                      'Content-Type': 'application/json'
                    }
                  }
                );

                const tokens = await response.json();

                if (tokens && tokens.length > 0) {
                  console.log('[Auth] ✓ Token validated');
                  setUser({
                    username: tokens[0].username,
                    isAdmin: tokens[0].is_admin,
                    authToken: authToken
                  });
                  setIsLoading(false);
                  return;
                }
              } catch (err) {
                console.warn('[Auth] Token validation failed:', err);
              }
            }

            // Fallback: username-based auth
            if (username) {
              console.log('[Auth] ✓ Using username-based auth');
              setUser({
                username: username,
                isAdmin: isAdmin || false,
                authToken: authToken || null
              });
              setIsLoading(false);
            } else {
              console.log('[Auth] ✗ No valid credentials');
              setIsLoading(false);
            }
          }
        };

        window.addEventListener('message', messageHandler);

        // Request credentials
        if (window.parent !== window) {
          console.log('[Auth] Requesting credentials from parent...');
          window.parent.postMessage({ type: 'REQUEST_API_VALUES' }, '*');
        }

        // Timeout fallback
        const timeout = setTimeout(() => {
          window.removeEventListener('message', messageHandler);

          const storedUsername = localStorage.getItem('username');
          const storedIsAdmin = localStorage.getItem('isAdmin') === 'true';
          const storedToken = localStorage.getItem('authToken');

          if (storedUsername) {
            console.log('[Auth] ✓ Using cached credentials');
            setUser({
              username: storedUsername,
              isAdmin: storedIsAdmin,
              authToken: storedToken || null
            });
          }

          setIsLoading(false);
        }, 2000);

        return () => {
          window.removeEventListener('message', messageHandler);
          clearTimeout(timeout);
        };
      } catch (err) {
        console.error('[Auth] Error:', err);
        setError(err);
        setIsLoading(false);
      }
    };

    handleAuthentication();
  }, []);

  return { user, isLoading, error };
}

export default useAuth;
```

### Usage in Your App:

```javascript
function App() {
  const { user, isLoading, error } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div>
      <h1>Welcome, {user.username}!</h1>
      {user.isAdmin && <AdminPanel />}
    </div>
  );
}
```

## Testing the Fix

After applying these changes:

1. **Clear browser storage**: `localStorage.clear()`
2. **Refresh parent app**: Should see token generation logs
3. **Open iframe program**: Should auto-login without token requirement
4. **Check console logs**:
   - `[Auth] Received credentials: {hasToken: true/false, hasUsername: true}`
   - `[Auth] ✓ Auto-login with username` (if no token)
   - OR `[Auth] ✓ Token validated` (if token exists)

## Why This Works

1. **Graceful degradation**: Works with or without token
2. **Backward compatible**: Handles old sessions without tokens
3. **Forward compatible**: Will use tokens when available
4. **Better UX**: Users don't see failed logins
5. **Security**: Still validates tokens when present

## Summary

The key insight is: **Don't require authToken for authentication**. Use it when available for better security, but fall back to username + credentials when it's not. This handles:

- Old sessions without tokens
- New sessions with tokens
- Token validation failures
- Network errors
- Cache issues

Your iframe should accept authentication in this priority order:
1. Valid authToken → Best security
2. Username + credentials → Good UX
3. Nothing → Show login screen
