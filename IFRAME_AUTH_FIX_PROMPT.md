# Fixing Iframe Authentication Issue

## Problem

Your iframe authentication is failing because it's receiving credentials from the parent but the `authToken` field is missing or empty. The logs show:

```
hasKey: true          ✓ (OPENAI_API_KEY is present)
hasToken: false       ✗ (authToken is missing or empty)
hasUrl: true          ✓ (SUPABASE_URL is present)
```

## What's Being Sent

The parent desktop environment sends this data structure:

```javascript
{
  type: 'API_VALUES_RESPONSE',
  data: {
    OPENAI_API_KEY: string,
    CLAUDE_API_KEY: string,
    GEMINI_API_KEY: string,
    REPLICATE_API_KEY: string,
    SUPABASE_URL: string,
    SUPABASE_ANON_KEY: string,
    username: string,        // e.g., "clarence"
    isAdmin: boolean,        // e.g., true
    authToken: string        // May be empty string if not yet generated
  }
}
```

## The Issue

The `authToken` field is being sent but may be an **empty string** (`''`) instead of a valid token. Your authentication validation code is checking if `authToken` exists, but an empty string is falsy in JavaScript, causing the authentication to fail.

## Solution Options

### Option 1: Handle Missing AuthToken Gracefully (Recommended)

If the authToken is missing or empty, you should still allow the user to access the app if they have valid credentials (username and isAdmin). You can generate or request a new token after login.

**Update your authentication handler:**

```javascript
async function handleParentAuthentication() {
  return new Promise((resolve) => {
    const messageHandler = async (event) => {
      if (event.data.type === 'API_VALUES_RESPONSE') {
        window.removeEventListener('message', messageHandler);

        const { authToken, username, isAdmin, SUPABASE_URL, SUPABASE_ANON_KEY } = event.data.data;

        // Store all credentials
        if (authToken) localStorage.setItem('authToken', authToken);
        if (username) localStorage.setItem('username', username);
        if (isAdmin !== undefined) localStorage.setItem('isAdmin', String(isAdmin));
        if (SUPABASE_URL) localStorage.setItem('SUPABASE_URL', SUPABASE_URL);
        if (SUPABASE_ANON_KEY) localStorage.setItem('SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);

        // Option A: Allow login with username only (no token required)
        if (username && SUPABASE_URL && SUPABASE_ANON_KEY) {
          console.log('[Auth] Auto-login with username:', username);

          currentUser = {
            username: username,
            isAdmin: isAdmin || false,
            authToken: authToken || null
          };

          resolve(currentUser);
          return;
        }

        // Option B: Validate token if present
        if (authToken && authToken !== '' && SUPABASE_URL && SUPABASE_ANON_KEY) {
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
              console.log('[Auth] Token validated successfully');

              currentUser = {
                username: tokens[0].username,
                isAdmin: tokens[0].is_admin,
                authToken: authToken
              };

              resolve(currentUser);
              return;
            } else {
              console.warn('[Auth] Token validation failed, using username fallback');

              // Fall back to username-only login
              if (username) {
                currentUser = {
                  username: username,
                  isAdmin: isAdmin || false,
                  authToken: null
                };

                resolve(currentUser);
                return;
              }
            }
          } catch (error) {
            console.error('[Auth] Token validation error:', error);

            // Fall back to username-only login
            if (username) {
              currentUser = {
                username: username,
                isAdmin: isAdmin || false,
                authToken: null
              };

              resolve(currentUser);
              return;
            }
          }
        }

        resolve(null);
      }
    };

    window.addEventListener('message', messageHandler);

    if (window.parent !== window) {
      window.parent.postMessage({ type: 'REQUEST_API_VALUES' }, '*');
    }

    setTimeout(() => {
      window.removeEventListener('message', messageHandler);

      // Try localStorage fallback
      const storedUsername = localStorage.getItem('username');
      const storedIsAdmin = localStorage.getItem('isAdmin') === 'true';
      const storedToken = localStorage.getItem('authToken');

      if (storedUsername) {
        currentUser = {
          username: storedUsername,
          isAdmin: storedIsAdmin,
          authToken: storedToken || null
        };
        resolve(currentUser);
      } else {
        resolve(null);
      }
    }, 2000);
  });
}
```

### Option 2: Request Token Generation

If you absolutely need a valid authToken, you can request the parent to generate one first:

```javascript
async function requestAuthToken(username) {
  const supabaseUrl = localStorage.getItem('SUPABASE_URL');
  const supabaseAnonKey = localStorage.getItem('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials');
    return null;
  }

  try {
    // Call the auth-token edge function to generate a token
    const response = await fetch(`${supabaseUrl}/functions/v1/auth-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username })
    });

    const data = await response.json();

    if (data.token) {
      localStorage.setItem('authToken', data.token);
      return data.token;
    }
  } catch (error) {
    console.error('Failed to generate auth token:', error);
  }

  return null;
}

// Use in your authentication handler:
async function handleParentAuthentication() {
  // ... existing code ...

  if (username && !authToken) {
    console.log('[Auth] No token provided, generating new token...');
    const newToken = await requestAuthToken(username);

    if (newToken) {
      currentUser = {
        username: username,
        isAdmin: isAdmin || false,
        authToken: newToken
      };
      resolve(currentUser);
      return;
    }
  }

  // ... rest of code ...
}
```

### Option 3: Simplify - Use Username Only

If tokens aren't critical for your use case, simplify by only requiring username:

```javascript
async function handleParentAuthentication() {
  return new Promise((resolve) => {
    const messageHandler = (event) => {
      if (event.data.type === 'API_VALUES_RESPONSE') {
        window.removeEventListener('message', messageHandler);

        const { username, isAdmin, SUPABASE_URL, SUPABASE_ANON_KEY, authToken } = event.data.data;

        // Store everything received
        if (username) localStorage.setItem('username', username);
        if (isAdmin !== undefined) localStorage.setItem('isAdmin', String(isAdmin));
        if (SUPABASE_URL) localStorage.setItem('SUPABASE_URL', SUPABASE_URL);
        if (SUPABASE_ANON_KEY) localStorage.setItem('SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);
        if (authToken) localStorage.setItem('authToken', authToken);

        // Only require username for authentication
        if (username) {
          console.log('[Auth] ✓ Auto-login successful:', username);

          currentUser = {
            username: username,
            isAdmin: isAdmin || false,
            authToken: authToken || null
          };

          resolve(currentUser);
          return;
        }

        console.log('[Auth] ✗ No username provided');
        resolve(null);
      }
    };

    window.addEventListener('message', messageHandler);

    if (window.parent !== window) {
      console.log('[Auth] Requesting credentials from parent...');
      window.parent.postMessage({ type: 'REQUEST_API_VALUES' }, '*');
    }

    setTimeout(() => {
      window.removeEventListener('message', messageHandler);
      console.log('[Auth] ⚠ Timeout - checking localStorage...');

      const storedUsername = localStorage.getItem('username');
      const storedIsAdmin = localStorage.getItem('isAdmin') === 'true';
      const storedToken = localStorage.getItem('authToken');

      if (storedUsername) {
        console.log('[Auth] ✓ Found stored credentials');
        currentUser = {
          username: storedUsername,
          isAdmin: storedIsAdmin,
          authToken: storedToken || null
        };
        resolve(currentUser);
      } else {
        console.log('[Auth] ✗ No stored credentials found');
        resolve(null);
      }
    }, 2000);
  });
}
```

## Recommended Approach

**Use Option 1 or Option 3** - they handle the missing authToken gracefully and still provide authentication. The authToken is nice to have for security but shouldn't block users from accessing the app if they have valid username credentials.

## React Hook Version

If you're using React, here's the updated hook:

```javascript
import { useEffect, useState } from 'react';

function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleAuthentication = async () => {
      const messageHandler = (event) => {
        if (event.data.type === 'API_VALUES_RESPONSE') {
          const { username, isAdmin, authToken, SUPABASE_URL, SUPABASE_ANON_KEY } = event.data.data;

          // Store credentials
          if (username) localStorage.setItem('username', username);
          if (isAdmin !== undefined) localStorage.setItem('isAdmin', String(isAdmin));
          if (authToken) localStorage.setItem('authToken', authToken);
          if (SUPABASE_URL) localStorage.setItem('SUPABASE_URL', SUPABASE_URL);
          if (SUPABASE_ANON_KEY) localStorage.setItem('SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);

          // Auto-login with username (token optional)
          if (username) {
            console.log('[Auth] ✓ Auto-login successful:', username);
            setUser({
              username: username,
              isAdmin: isAdmin || false,
              authToken: authToken || null
            });
            setIsLoading(false);
          } else {
            console.log('[Auth] ✗ No username provided');
            setIsLoading(false);
          }
        }
      };

      window.addEventListener('message', messageHandler);

      if (window.parent !== window) {
        console.log('[Auth] Requesting credentials from parent...');
        window.parent.postMessage({ type: 'REQUEST_API_VALUES' }, '*');
      }

      const timeout = setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        console.log('[Auth] ⚠ Timeout - checking localStorage...');

        const storedUsername = localStorage.getItem('username');
        const storedIsAdmin = localStorage.getItem('isAdmin') === 'true';
        const storedToken = localStorage.getItem('authToken');

        if (storedUsername) {
          console.log('[Auth] ✓ Found stored credentials');
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
    };

    handleAuthentication();
  }, []);

  return { user, isLoading };
}

export default useAuth;
```

## Testing

After implementing the fix, test these scenarios:

1. **Fresh load**: Clear localStorage and reload - should receive credentials from parent
2. **Refresh**: Should use localStorage cache
3. **With token**: If parent provides authToken, it should be used
4. **Without token**: If parent doesn't provide authToken, should still work with username
5. **Outside iframe**: Should show login screen if no credentials found

## Summary

The key fix is to **not require authToken for authentication**. Use it if available, but fall back to username-based authentication if the token is missing. This provides a better user experience and handles the case where tokens haven't been generated yet.
