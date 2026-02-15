# Iframe Program Integration Guide

## Complete Authentication & API Integration for Embedded Programs

This guide provides everything you need to integrate your web application with the ClaSol Desktop Environment as an embedded iframe program. Follow this guide to enable automatic authentication, API access, and seamless user experience.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication Protocol](#authentication-protocol)
3. [Implementation - Vanilla JavaScript](#implementation---vanilla-javascript)
4. [Implementation - React](#implementation---react)
5. [Available Credentials](#available-credentials)
6. [Security Considerations](#security-considerations)
7. [Testing & Debugging](#testing--debugging)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Overview

### What This Integration Provides

When your program runs as an iframe inside the ClaSol Desktop Environment, it automatically receives:

- **User Authentication**: Username, admin status, and authentication token
- **API Credentials**: OpenAI API key, Supabase URL, and Supabase anonymous key
- **Automatic Login**: Users don't need to log in again to your program
- **Secure Communication**: Credentials are sent via secure postMessage protocol
- **Session Persistence**: Credentials are cached in localStorage for reload handling

### How It Works

1. Your iframe loads inside the parent desktop environment
2. Your program sends `REQUEST_API_VALUES` message to parent
3. Parent responds with `API_VALUES_RESPONSE` containing all credentials
4. Your program validates credentials and auto-logs in the user
5. User starts using your program immediately (no login screen needed)

### Three-Tier Authentication Priority

Your iframe should authenticate in this order:

1. **Token Validation** (if `authToken` present) → Best security, validates against database
2. **Username + Credentials** (if no token) → Good UX, backward compatible
3. **Show Login Screen** (if nothing) → Last resort, standalone mode

---

## Authentication Protocol

### Message Types

#### 1. Request Credentials (Your Iframe → Parent)

```javascript
window.parent.postMessage({
  type: 'REQUEST_API_VALUES'
}, '*');
```

#### 2. Receive Credentials (Parent → Your Iframe)

```javascript
{
  type: 'API_VALUES_RESPONSE',
  data: {
    authToken: 'sk-auth-abc123...xyz',           // Authentication token (72+ chars)
    username: 'john_doe',                        // Username
    isAdmin: true,                               // Admin privileges boolean
    SUPABASE_URL: 'https://xyz.supabase.co',    // Supabase project URL
    SUPABASE_ANON_KEY: 'eyJ...',                 // Supabase anonymous key
    OPENAI_API_KEY: 'sk-proj-...'                // OpenAI API key (may be null)
  },
  apiKey: 'sk-proj-...'  // Legacy field, use data.OPENAI_API_KEY instead
}
```

### Token Validation Endpoint

To validate an `authToken`, query the Supabase `auth_tokens` table:

```javascript
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
  // Token is valid
  const username = tokens[0].username;
  const isAdmin = tokens[0].is_admin;
}
```

---

## Implementation - Vanilla JavaScript

### Complete Authentication Handler

```javascript
/**
 * Handles authentication when running inside ClaSol Desktop iframe
 * @returns {Promise<User|null>} User object if authenticated, null otherwise
 */
async function handleIframeAuthentication() {
  console.log('[Auth] Initializing iframe authentication...');

  return new Promise((resolve) => {
    const messageHandler = async (event) => {
      // Only handle API_VALUES_RESPONSE messages
      if (event.data.type !== 'API_VALUES_RESPONSE') return;

      // Remove listener after receiving response
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
        tokenLength: authToken?.length || 0,
        hasUsername: !!username,
        hasKey: !!OPENAI_API_KEY,
        hasSupabase: !!(SUPABASE_URL && SUPABASE_ANON_KEY),
        isAdmin: !!isAdmin
      });

      // Store all credentials in localStorage for persistence
      if (authToken) localStorage.setItem('authToken', authToken);
      if (username) localStorage.setItem('username', username);
      if (isAdmin !== undefined) localStorage.setItem('isAdmin', String(isAdmin));
      if (SUPABASE_URL) localStorage.setItem('SUPABASE_URL', SUPABASE_URL);
      if (SUPABASE_ANON_KEY) localStorage.setItem('SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);
      if (OPENAI_API_KEY) localStorage.setItem('OPENAI_API_KEY', OPENAI_API_KEY);

      // PRIORITY 1: Validate authToken if present
      if (authToken && authToken.length > 0 && SUPABASE_URL && SUPABASE_ANON_KEY) {
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
              authToken: authToken,
              supabaseUrl: SUPABASE_URL,
              supabaseKey: SUPABASE_ANON_KEY,
              openaiKey: OPENAI_API_KEY
            };

            resolve(user);
            return;
          } else {
            console.warn('[Auth] ⚠ Token expired or invalid, falling back...');
          }
        } catch (error) {
          console.warn('[Auth] ⚠ Token validation error:', error.message);
        }
      }

      // PRIORITY 2: Use username + credentials (no token validation)
      if (username && (OPENAI_API_KEY || SUPABASE_URL)) {
        console.log('[Auth] ✓ Auto-login with username (no token):', username);

        const user = {
          username: username,
          isAdmin: isAdmin || false,
          authToken: authToken || null,
          supabaseUrl: SUPABASE_URL,
          supabaseKey: SUPABASE_ANON_KEY,
          openaiKey: OPENAI_API_KEY
        };

        resolve(user);
        return;
      }

      // PRIORITY 3: No valid credentials received
      console.log('[Auth] ✗ No valid credentials received');
      resolve(null);
    };

    // Listen for parent response
    window.addEventListener('message', messageHandler);

    // Detect if running in iframe
    const isIframe = window.self !== window.top;

    if (isIframe) {
      console.log('[Auth] Running in iframe, requesting credentials from parent...');
      window.parent.postMessage({ type: 'REQUEST_API_VALUES' }, '*');
    } else {
      console.log('[Auth] Running standalone, checking localStorage...');
      window.removeEventListener('message', messageHandler);

      // Standalone mode - check localStorage
      const storedUsername = localStorage.getItem('username');
      const storedIsAdmin = localStorage.getItem('isAdmin') === 'true';
      const storedToken = localStorage.getItem('authToken');
      const storedSupabaseUrl = localStorage.getItem('SUPABASE_URL');
      const storedSupabaseKey = localStorage.getItem('SUPABASE_ANON_KEY');
      const storedOpenAIKey = localStorage.getItem('OPENAI_API_KEY');

      if (storedUsername) {
        console.log('[Auth] ✓ Found cached credentials');
        resolve({
          username: storedUsername,
          isAdmin: storedIsAdmin,
          authToken: storedToken,
          supabaseUrl: storedSupabaseUrl,
          supabaseKey: storedSupabaseKey,
          openaiKey: storedOpenAIKey
        });
        return;
      }

      resolve(null);
      return;
    }

    // Timeout fallback (2 seconds)
    setTimeout(() => {
      window.removeEventListener('message', messageHandler);
      console.log('[Auth] ⏱ Timeout - checking localStorage fallback...');

      const storedUsername = localStorage.getItem('username');
      const storedIsAdmin = localStorage.getItem('isAdmin') === 'true';
      const storedToken = localStorage.getItem('authToken');
      const storedSupabaseUrl = localStorage.getItem('SUPABASE_URL');
      const storedSupabaseKey = localStorage.getItem('SUPABASE_ANON_KEY');
      const storedOpenAIKey = localStorage.getItem('OPENAI_API_KEY');

      if (storedUsername || storedOpenAIKey) {
        console.log('[Auth] ✓ Found stored credentials');
        resolve({
          username: storedUsername || 'guest',
          isAdmin: storedIsAdmin,
          authToken: storedToken,
          supabaseUrl: storedSupabaseUrl,
          supabaseKey: storedSupabaseKey,
          openaiKey: storedOpenAIKey
        });
      } else {
        console.log('[Auth] ✗ No stored credentials found');
        resolve(null);
      }
    }, 2000);
  });
}

// Usage Example
async function initializeApp() {
  console.log('[App] Starting initialization...');

  const user = await handleIframeAuthentication();

  if (user) {
    console.log('[App] ✓ User authenticated:', user.username);
    console.log('[App] Admin privileges:', user.isAdmin);

    // Hide login screen, show main app
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';

    // Initialize your app with user data
    startApp(user);
  } else {
    console.log('[App] ✗ No authentication, showing login screen');

    // Show login screen
    document.getElementById('login-screen').style.display = 'block';
    document.getElementById('main-app').style.display = 'none';
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
```

---

## Implementation - React

### Custom Hook: `useClaSolAuth`

```javascript
import { useEffect, useState } from 'react';

/**
 * Custom React hook for ClaSol Desktop iframe authentication
 * @returns {{user: User|null, isLoading: boolean, error: Error|null}}
 */
function useClaSolAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('[Auth] Initializing authentication...');

    const handleAuthentication = async () => {
      try {
        const messageHandler = async (event) => {
          if (event.data.type !== 'API_VALUES_RESPONSE') return;

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
            tokenLength: authToken?.length || 0,
            hasUsername: !!username,
            hasKey: !!OPENAI_API_KEY,
            hasSupabase: !!(SUPABASE_URL && SUPABASE_ANON_KEY),
            isAdmin: !!isAdmin
          });

          // Store credentials
          if (authToken) localStorage.setItem('authToken', authToken);
          if (username) localStorage.setItem('username', username);
          if (isAdmin !== undefined) localStorage.setItem('isAdmin', String(isAdmin));
          if (SUPABASE_URL) localStorage.setItem('SUPABASE_URL', SUPABASE_URL);
          if (SUPABASE_ANON_KEY) localStorage.setItem('SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);
          if (OPENAI_API_KEY) localStorage.setItem('OPENAI_API_KEY', OPENAI_API_KEY);

          // PRIORITY 1: Validate token if present
          if (authToken && authToken.length > 0 && SUPABASE_URL && SUPABASE_ANON_KEY) {
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
                setUser({
                  username: tokens[0].username,
                  isAdmin: tokens[0].is_admin,
                  authToken: authToken,
                  supabaseUrl: SUPABASE_URL,
                  supabaseKey: SUPABASE_ANON_KEY,
                  openaiKey: OPENAI_API_KEY
                });
                setIsLoading(false);
                return;
              } else {
                console.warn('[Auth] ⚠ Token expired or invalid');
              }
            } catch (err) {
              console.warn('[Auth] ⚠ Token validation error:', err.message);
            }
          }

          // PRIORITY 2: Username-based auth
          if (username && (OPENAI_API_KEY || SUPABASE_URL)) {
            console.log('[Auth] ✓ Using username-based auth:', username);
            setUser({
              username: username,
              isAdmin: isAdmin || false,
              authToken: authToken || null,
              supabaseUrl: SUPABASE_URL,
              supabaseKey: SUPABASE_ANON_KEY,
              openaiKey: OPENAI_API_KEY
            });
            setIsLoading(false);
          } else {
            console.log('[Auth] ✗ No valid credentials');
            setIsLoading(false);
          }
        };

        window.addEventListener('message', messageHandler);

        // Check if running in iframe
        const isIframe = window.self !== window.top;

        if (isIframe) {
          console.log('[Auth] Running in iframe, requesting credentials...');
          window.parent.postMessage({ type: 'REQUEST_API_VALUES' }, '*');
        } else {
          console.log('[Auth] Running standalone, checking cache...');

          const storedUsername = localStorage.getItem('username');
          const storedIsAdmin = localStorage.getItem('isAdmin') === 'true';
          const storedToken = localStorage.getItem('authToken');
          const storedSupabaseUrl = localStorage.getItem('SUPABASE_URL');
          const storedSupabaseKey = localStorage.getItem('SUPABASE_ANON_KEY');
          const storedOpenAIKey = localStorage.getItem('OPENAI_API_KEY');

          if (storedUsername) {
            console.log('[Auth] ✓ Using cached credentials');
            setUser({
              username: storedUsername,
              isAdmin: storedIsAdmin,
              authToken: storedToken,
              supabaseUrl: storedSupabaseUrl,
              supabaseKey: storedSupabaseKey,
              openaiKey: storedOpenAIKey
            });
          }

          setIsLoading(false);
          window.removeEventListener('message', messageHandler);
          return;
        }

        // Timeout fallback
        const timeout = setTimeout(() => {
          window.removeEventListener('message', messageHandler);
          console.log('[Auth] ⏱ Timeout - checking localStorage...');

          const storedUsername = localStorage.getItem('username');
          const storedIsAdmin = localStorage.getItem('isAdmin') === 'true';
          const storedToken = localStorage.getItem('authToken');
          const storedSupabaseUrl = localStorage.getItem('SUPABASE_URL');
          const storedSupabaseKey = localStorage.getItem('SUPABASE_ANON_KEY');
          const storedOpenAIKey = localStorage.getItem('OPENAI_API_KEY');

          if (storedUsername || storedOpenAIKey) {
            console.log('[Auth] ✓ Found stored credentials');
            setUser({
              username: storedUsername || 'guest',
              isAdmin: storedIsAdmin,
              authToken: storedToken,
              supabaseUrl: storedSupabaseUrl,
              supabaseKey: storedSupabaseKey,
              openaiKey: storedOpenAIKey
            });
          }

          setIsLoading(false);
        }, 2000);

        return () => {
          window.removeEventListener('message', messageHandler);
          clearTimeout(timeout);
        };
      } catch (err) {
        console.error('[Auth] Error during authentication:', err);
        setError(err);
        setIsLoading(false);
      }
    };

    handleAuthentication();
  }, []);

  return { user, isLoading, error };
}

export default useClaSolAuth;
```

### React App Component Example

```javascript
import React from 'react';
import useClaSolAuth from './hooks/useClaSolAuth';

function App() {
  const { user, isLoading, error } = useClaSolAuth();

  // Show loading screen while authenticating
  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Authenticating...</p>
      </div>
    );
  }

  // Show error if authentication failed
  if (error) {
    return (
      <div className="error-screen">
        <h2>Authentication Error</h2>
        <p>{error.message}</p>
      </div>
    );
  }

  // Show login screen if no user
  if (!user) {
    return <LoginScreen />;
  }

  // User authenticated - show main app
  return (
    <div className="app">
      <header>
        <h1>Welcome, {user.username}!</h1>
        {user.isAdmin && <span className="badge">Admin</span>}
      </header>

      <main>
        {/* Your app content here */}
        <YourMainComponent user={user} />
      </main>
    </div>
  );
}

export default App;
```

---

## Available Credentials

### User Authentication

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `authToken` | string \| null | Cryptographic authentication token (72+ chars) | `sk-auth-abc123...xyz` |
| `username` | string | User's username | `john_doe` |
| `isAdmin` | boolean | Admin privileges flag | `true` or `false` |

### API Credentials

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `SUPABASE_URL` | string | Supabase project URL | `https://xyz.supabase.co` |
| `SUPABASE_ANON_KEY` | string | Supabase anonymous key (JWT) | `eyJhbGc...` |
| `OPENAI_API_KEY` | string \| null | OpenAI API key | `sk-proj-...` |

### Field Availability

- **Always Present**: `username`, `isAdmin`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- **Conditionally Present**: `authToken` (present for new sessions, may be null for old sessions)
- **Optional**: `OPENAI_API_KEY` (may be null if not configured)

---

## Security Considerations

### Do's

- **Always store credentials in localStorage** for persistence across reloads
- **Validate authToken** against Supabase before trusting it
- **Check token expiration** using `expires_at > current_time` in query
- **Use HTTPS** for all API calls to prevent interception
- **Clear credentials** on logout: `localStorage.clear()`
- **Log authentication steps** for debugging (without exposing full tokens)

### Don'ts

- **Never log full tokens** to console (use `token.substring(0, 10) + '...'`)
- **Never send tokens** to third-party services
- **Never expose tokens** in URLs or GET parameters
- **Don't trust username** without token validation for sensitive operations
- **Don't hardcode** API keys or credentials
- **Don't skip token validation** for admin-only features

### Example: Secure Token Logging

```javascript
// BAD - Exposes full token
console.log('Token:', authToken);

// GOOD - Shows partial token
console.log('Token:', authToken ? `${authToken.substring(0, 10)}...` : 'none');

// BETTER - Shows only token presence and length
console.log('Token info:', {
  hasToken: !!authToken,
  tokenLength: authToken?.length || 0
});
```

---

## Testing & Debugging

### Enable Debug Logging

All code examples include console logging. Look for these prefixes:

- `[Auth]` - Authentication-related logs
- `[App]` - Application initialization logs
- `[API]` - API call logs

### Testing Checklist

#### 1. Iframe Mode (Inside Desktop)

- [ ] Open browser console
- [ ] Look for `[Auth] Running in iframe, requesting credentials...`
- [ ] Check for `[Auth] Received credentials: {hasToken: true, ...}`
- [ ] Verify `[Auth] ✓ Token validated successfully` OR `[Auth] ✓ Auto-login with username`
- [ ] Confirm no login screen is shown
- [ ] Test admin-only features (if `isAdmin: true`)

#### 2. Standalone Mode (Direct URL)

- [ ] Open your app directly (not in iframe)
- [ ] Look for `[Auth] Running standalone, checking localStorage...`
- [ ] If cached credentials exist: `[Auth] ✓ Found cached credentials`
- [ ] If no cache: Login screen should appear
- [ ] After login: Credentials should persist in localStorage

#### 3. Token Validation

```javascript
// Test token validation in browser console
const token = localStorage.getItem('authToken');
const url = localStorage.getItem('SUPABASE_URL');
const key = localStorage.getItem('SUPABASE_ANON_KEY');

fetch(`${url}/rest/v1/auth_tokens?token=eq.${token}&expires_at=gt.${new Date().toISOString()}&select=username,is_admin`, {
  headers: { 'apikey': key, 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(d => console.log('Token validation:', d));
```

Expected output:
```json
[
  {
    "username": "john_doe",
    "is_admin": true
  }
]
```

#### 4. Credential Persistence

```javascript
// Check stored credentials in browser console
console.log('Stored credentials:', {
  username: localStorage.getItem('username'),
  isAdmin: localStorage.getItem('isAdmin'),
  hasToken: !!localStorage.getItem('authToken'),
  tokenLength: localStorage.getItem('authToken')?.length || 0,
  hasSupabase: !!localStorage.getItem('SUPABASE_URL'),
  hasOpenAI: !!localStorage.getItem('OPENAI_API_KEY')
});
```

---

## Troubleshooting

### Problem: "Authentication failed" even though credentials received

**Symptoms:**
```
[Auth] Received credentials: {hasToken: true, ...}
[Auth] Authentication failed
```

**Solutions:**

1. **Check token validation logic** - Make sure you're not requiring token when it might be null
2. **Add fallback to username-based auth** - See Priority 2 in code examples
3. **Check for typos** in field names (`authToken` not `auth_token`)
4. **Verify Supabase connectivity** - Test token validation query manually

### Problem: "No credentials received" in iframe

**Symptoms:**
```
[Auth] Running in iframe, requesting credentials...
[Auth] ⏱ Timeout - checking localStorage fallback...
[Auth] ✗ No stored credentials found
```

**Solutions:**

1. **Check parent is ClaSol Desktop** - Credentials only sent from ClaSol parent
2. **Verify postMessage origin** - Some parents block `'*'` origin, use specific origin
3. **Check browser console** for CSP errors
4. **Increase timeout** from 2000ms to 5000ms if slow network

### Problem: Token validation returns empty array

**Symptoms:**
```
[Auth] Attempting token validation...
[Auth] ⚠ Token expired or invalid, falling back...
```

**Solutions:**

1. **Check token expiration** - Token might be expired
2. **Verify Supabase URL and key** - Wrong URL/key will fail silently
3. **Check auth_tokens table** - Token might not exist in database
4. **Test query manually** - Use browser console to test query

### Problem: Credentials not persisting across reloads

**Symptoms:**
- User authenticated, then page reloads
- Login screen appears again after reload

**Solutions:**

1. **Verify localStorage writes** - Check all `localStorage.setItem()` calls execute
2. **Check browser privacy settings** - Incognito mode clears localStorage on close
3. **Test localStorage directly**:
   ```javascript
   localStorage.setItem('test', 'value');
   console.log(localStorage.getItem('test')); // Should log 'value'
   ```

### Problem: Admin features not working

**Symptoms:**
- `isAdmin` is `false` but should be `true`
- Admin UI not showing

**Solutions:**

1. **Check isAdmin parsing**:
   ```javascript
   const isAdmin = localStorage.getItem('isAdmin') === 'true'; // String to boolean
   ```
2. **Verify token validation** returns correct `is_admin` field
3. **Check user has admin role** in parent app
4. **Test with console**:
   ```javascript
   console.log('isAdmin:', localStorage.getItem('isAdmin'), typeof localStorage.getItem('isAdmin'));
   ```

---

## Best Practices

### 1. Always Implement Three-Tier Authentication

```javascript
// PRIORITY 1: Token validation (best security)
if (authToken) {
  const valid = await validateToken(authToken);
  if (valid) return user;
}

// PRIORITY 2: Username + credentials (good UX)
if (username) {
  return user;
}

// PRIORITY 3: Show login screen
return null;
```

### 2. Cache Everything in localStorage

```javascript
// Store all credentials for reload handling
if (authToken) localStorage.setItem('authToken', authToken);
if (username) localStorage.setItem('username', username);
if (isAdmin !== undefined) localStorage.setItem('isAdmin', String(isAdmin));
// ... store all other fields
```

### 3. Implement Proper Loading States

```javascript
// Show loading spinner while authenticating
if (isLoading) return <LoadingScreen />;

// Show error if authentication failed
if (error) return <ErrorScreen error={error} />;

// Show login if no user
if (!user) return <LoginScreen />;

// Show app if authenticated
return <MainApp user={user} />;
```

### 4. Add Comprehensive Logging

```javascript
console.log('[Auth] Received credentials:', {
  hasToken: !!authToken,
  tokenLength: authToken?.length || 0,  // Don't log full token
  hasUsername: !!username,
  hasKey: !!OPENAI_API_KEY,
  isAdmin: !!isAdmin
});
```

### 5. Handle Both Iframe and Standalone Modes

```javascript
const isIframe = window.self !== window.top;

if (isIframe) {
  // Request credentials from parent
  window.parent.postMessage({ type: 'REQUEST_API_VALUES' }, '*');
} else {
  // Check localStorage for cached credentials
  const storedUsername = localStorage.getItem('username');
  if (storedUsername) {
    // Use cached credentials
  } else {
    // Show login screen
  }
}
```

### 6. Set Reasonable Timeouts

```javascript
// 2 seconds is good for most cases
const timeout = setTimeout(() => {
  // Fallback to localStorage
}, 2000);

// 5 seconds for slow networks
const timeout = setTimeout(() => {
  // Fallback to localStorage
}, 5000);
```

### 7. Clean Up Event Listeners

```javascript
// Vanilla JS
const messageHandler = (event) => { /* ... */ };
window.addEventListener('message', messageHandler);

// Remember to remove
window.removeEventListener('message', messageHandler);

// React
useEffect(() => {
  const handler = (event) => { /* ... */ };
  window.addEventListener('message', handler);

  return () => {
    window.removeEventListener('message', handler); // Cleanup
  };
}, []);
```

### 8. Validate API Responses

```javascript
// Don't trust API responses blindly
const response = await fetch(apiUrl);
const data = await response.json();

if (!data || !Array.isArray(data) || data.length === 0) {
  console.warn('[API] Invalid response:', data);
  return null;
}

// Now safe to use
const user = data[0];
```

---

## Quick Start Templates

### Minimal HTML + JavaScript Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My ClaSol Program</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    .loading { text-align: center; padding: 50px; }
    .hidden { display: none; }
  </style>
</head>
<body>
  <div id="loading" class="loading">
    <p>Authenticating...</p>
  </div>

  <div id="login" class="hidden">
    <h2>Please log in</h2>
    <input type="text" id="username" placeholder="Username">
    <button onclick="handleLogin()">Login</button>
  </div>

  <div id="app" class="hidden">
    <h1>Welcome, <span id="user-name"></span>!</h1>
    <p>Your app content here...</p>
  </div>

  <script>
    async function handleIframeAuth() {
      return new Promise((resolve) => {
        const handler = async (event) => {
          if (event.data.type !== 'API_VALUES_RESPONSE') return;
          window.removeEventListener('message', handler);

          const { authToken, username, isAdmin, SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY } = event.data.data;

          // Store credentials
          if (authToken) localStorage.setItem('authToken', authToken);
          if (username) localStorage.setItem('username', username);
          if (isAdmin !== undefined) localStorage.setItem('isAdmin', String(isAdmin));
          if (SUPABASE_URL) localStorage.setItem('SUPABASE_URL', SUPABASE_URL);
          if (SUPABASE_ANON_KEY) localStorage.setItem('SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);
          if (OPENAI_API_KEY) localStorage.setItem('OPENAI_API_KEY', OPENAI_API_KEY);

          // Try token validation
          if (authToken && SUPABASE_URL && SUPABASE_ANON_KEY) {
            try {
              const res = await fetch(
                `${SUPABASE_URL}/rest/v1/auth_tokens?token=eq.${authToken}&expires_at=gt.${new Date().toISOString()}&select=username,is_admin`,
                { headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' } }
              );
              const tokens = await res.json();
              if (tokens?.length > 0) {
                resolve({ username: tokens[0].username, isAdmin: tokens[0].is_admin, authToken });
                return;
              }
            } catch (e) { console.warn('Token validation failed:', e); }
          }

          // Fallback to username
          if (username) {
            resolve({ username, isAdmin: isAdmin || false, authToken });
            return;
          }

          resolve(null);
        };

        window.addEventListener('message', handler);

        if (window.self !== window.top) {
          window.parent.postMessage({ type: 'REQUEST_API_VALUES' }, '*');
        } else {
          const stored = localStorage.getItem('username');
          window.removeEventListener('message', handler);
          resolve(stored ? { username: stored, isAdmin: localStorage.getItem('isAdmin') === 'true' } : null);
          return;
        }

        setTimeout(() => {
          window.removeEventListener('message', handler);
          const stored = localStorage.getItem('username');
          resolve(stored ? { username: stored, isAdmin: localStorage.getItem('isAdmin') === 'true' } : null);
        }, 2000);
      });
    }

    async function init() {
      const user = await handleIframeAuth();

      document.getElementById('loading').classList.add('hidden');

      if (user) {
        document.getElementById('user-name').textContent = user.username;
        document.getElementById('app').classList.remove('hidden');
      } else {
        document.getElementById('login').classList.remove('hidden');
      }
    }

    function handleLogin() {
      const username = document.getElementById('username').value;
      if (username) {
        localStorage.setItem('username', username);
        localStorage.setItem('isAdmin', 'false');
        location.reload();
      }
    }

    init();
  </script>
</body>
</html>
```

### Minimal React Template

```javascript
import React, { useEffect, useState } from 'react';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authenticate = async () => {
      const handler = async (event) => {
        if (event.data.type !== 'API_VALUES_RESPONSE') return;

        const { authToken, username, isAdmin, SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY } = event.data.data;

        if (authToken) localStorage.setItem('authToken', authToken);
        if (username) localStorage.setItem('username', username);
        if (isAdmin !== undefined) localStorage.setItem('isAdmin', String(isAdmin));
        if (SUPABASE_URL) localStorage.setItem('SUPABASE_URL', SUPABASE_URL);
        if (SUPABASE_ANON_KEY) localStorage.setItem('SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);
        if (OPENAI_API_KEY) localStorage.setItem('OPENAI_API_KEY', OPENAI_API_KEY);

        if (username) {
          setUser({ username, isAdmin: isAdmin || false, authToken });
        }
        setLoading(false);
      };

      window.addEventListener('message', handler);

      if (window.self !== window.top) {
        window.parent.postMessage({ type: 'REQUEST_API_VALUES' }, '*');
      } else {
        const stored = localStorage.getItem('username');
        if (stored) setUser({ username: stored, isAdmin: localStorage.getItem('isAdmin') === 'true' });
        setLoading(false);
        window.removeEventListener('message', handler);
        return;
      }

      const timeout = setTimeout(() => {
        const stored = localStorage.getItem('username');
        if (stored) setUser({ username: stored, isAdmin: localStorage.getItem('isAdmin') === 'true' });
        setLoading(false);
      }, 2000);

      return () => {
        window.removeEventListener('message', handler);
        clearTimeout(timeout);
      };
    };

    authenticate();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in</div>;

  return (
    <div>
      <h1>Welcome, {user.username}!</h1>
      <p>Your app content here...</p>
    </div>
  );
}

export default App;
```

---

## Summary

This guide provides everything needed to integrate your web application with the ClaSol Desktop Environment:

**Key Takeaways:**

1. **Three-tier authentication**: Token validation → Username fallback → Login screen
2. **Always cache credentials** in localStorage for reload handling
3. **Handle both iframe and standalone** modes gracefully
4. **Implement proper loading states** for better UX
5. **Add comprehensive logging** for easier debugging
6. **Never require authToken** - it's optional for backward compatibility
7. **Validate tokens when present** for better security
8. **Clean up event listeners** to prevent memory leaks

**Authentication Priority:**
```
Token Validation (if token exists)
         ↓ (if fails or missing)
Username + Credentials
         ↓ (if fails or missing)
Show Login Screen
```

**Questions or Issues?**

If you encounter problems not covered in the troubleshooting section:

1. Check browser console for `[Auth]` prefixed logs
2. Verify credentials with manual console tests
3. Test token validation endpoint separately
4. Ensure you're using the correct Supabase URL and keys
5. Check that parent is ClaSol Desktop Environment

---

**Last Updated:** 2026-02-15
**Compatible With:** ClaSol Desktop Environment v2.0+
**Protocol Version:** 1.0
