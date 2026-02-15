# ClaSol Iframe Integration - Quick Reference

## TL;DR

Copy-paste authentication code for your iframe program to work inside ClaSol Desktop.

---

## Vanilla JavaScript (Copy-Paste Ready)

```javascript
async function authenticateWithClaSol() {
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

      // Validate token (optional but recommended)
      if (authToken && SUPABASE_URL && SUPABASE_ANON_KEY) {
        try {
          const res = await fetch(
            `${SUPABASE_URL}/rest/v1/auth_tokens?token=eq.${authToken}&expires_at=gt.${new Date().toISOString()}&select=username,is_admin`,
            { headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' } }
          );
          const tokens = await res.json();
          if (tokens?.length > 0) {
            resolve({ username: tokens[0].username, isAdmin: tokens[0].is_admin, authToken, SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY });
            return;
          }
        } catch (e) {}
      }

      // Fallback: use username
      if (username) {
        resolve({ username, isAdmin: isAdmin || false, authToken, SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY });
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
      resolve(stored ? {
        username: stored,
        isAdmin: localStorage.getItem('isAdmin') === 'true',
        authToken: localStorage.getItem('authToken'),
        SUPABASE_URL: localStorage.getItem('SUPABASE_URL'),
        SUPABASE_ANON_KEY: localStorage.getItem('SUPABASE_ANON_KEY'),
        OPENAI_API_KEY: localStorage.getItem('OPENAI_API_KEY')
      } : null);
      return;
    }

    setTimeout(() => {
      window.removeEventListener('message', handler);
      const stored = localStorage.getItem('username');
      resolve(stored ? {
        username: stored,
        isAdmin: localStorage.getItem('isAdmin') === 'true',
        authToken: localStorage.getItem('authToken'),
        SUPABASE_URL: localStorage.getItem('SUPABASE_URL'),
        SUPABASE_ANON_KEY: localStorage.getItem('SUPABASE_ANON_KEY'),
        OPENAI_API_KEY: localStorage.getItem('OPENAI_API_KEY')
      } : null);
    }, 2000);
  });
}

// Usage
(async () => {
  const user = await authenticateWithClaSol();
  if (user) {
    console.log('Logged in as:', user.username);
    // Start your app
  } else {
    // Show login screen
  }
})();
```

---

## React Hook (Copy-Paste Ready)

**File: `hooks/useClaSolAuth.js`**

```javascript
import { useEffect, useState } from 'react';

export function useClaSolAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handler = async (event) => {
      if (event.data.type !== 'API_VALUES_RESPONSE') return;

      const { authToken, username, isAdmin, SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY } = event.data.data;

      if (authToken) localStorage.setItem('authToken', authToken);
      if (username) localStorage.setItem('username', username);
      if (isAdmin !== undefined) localStorage.setItem('isAdmin', String(isAdmin));
      if (SUPABASE_URL) localStorage.setItem('SUPABASE_URL', SUPABASE_URL);
      if (SUPABASE_ANON_KEY) localStorage.setItem('SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);
      if (OPENAI_API_KEY) localStorage.setItem('OPENAI_API_KEY', OPENAI_API_KEY);

      if (authToken && SUPABASE_URL && SUPABASE_ANON_KEY) {
        try {
          const res = await fetch(
            `${SUPABASE_URL}/rest/v1/auth_tokens?token=eq.${authToken}&expires_at=gt.${new Date().toISOString()}&select=username,is_admin`,
            { headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' } }
          );
          const tokens = await res.json();
          if (tokens?.length > 0) {
            setUser({ username: tokens[0].username, isAdmin: tokens[0].is_admin, authToken, SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY });
            setLoading(false);
            return;
          }
        } catch (e) {}
      }

      if (username) {
        setUser({ username, isAdmin: isAdmin || false, authToken, SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY });
      }
      setLoading(false);
    };

    window.addEventListener('message', handler);

    if (window.self !== window.top) {
      window.parent.postMessage({ type: 'REQUEST_API_VALUES' }, '*');
    } else {
      const stored = localStorage.getItem('username');
      if (stored) setUser({
        username: stored,
        isAdmin: localStorage.getItem('isAdmin') === 'true',
        authToken: localStorage.getItem('authToken'),
        SUPABASE_URL: localStorage.getItem('SUPABASE_URL'),
        SUPABASE_ANON_KEY: localStorage.getItem('SUPABASE_ANON_KEY'),
        OPENAI_API_KEY: localStorage.getItem('OPENAI_API_KEY')
      });
      setLoading(false);
      window.removeEventListener('message', handler);
      return;
    }

    const timeout = setTimeout(() => {
      const stored = localStorage.getItem('username');
      if (stored) setUser({
        username: stored,
        isAdmin: localStorage.getItem('isAdmin') === 'true',
        authToken: localStorage.getItem('authToken'),
        SUPABASE_URL: localStorage.getItem('SUPABASE_URL'),
        SUPABASE_ANON_KEY: localStorage.getItem('SUPABASE_ANON_KEY'),
        OPENAI_API_KEY: localStorage.getItem('OPENAI_API_KEY')
      });
      setLoading(false);
    }, 2000);

    return () => {
      window.removeEventListener('message', handler);
      clearTimeout(timeout);
    };
  }, []);

  return { user, loading };
}
```

**Usage:**

```javascript
import { useClaSolAuth } from './hooks/useClaSolAuth';

function App() {
  const { user, loading } = useClaSolAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <LoginScreen />;

  return <div>Welcome, {user.username}!</div>;
}
```

---

## Protocol Summary

### Request (Your App → Parent)

```javascript
window.parent.postMessage({ type: 'REQUEST_API_VALUES' }, '*');
```

### Response (Parent → Your App)

```javascript
{
  type: 'API_VALUES_RESPONSE',
  data: {
    authToken: 'sk-auth-...',        // May be null
    username: 'john_doe',             // Always present
    isAdmin: true,                    // Always present
    SUPABASE_URL: 'https://...',      // Always present
    SUPABASE_ANON_KEY: 'eyJ...',      // Always present
    OPENAI_API_KEY: 'sk-proj-...'     // May be null
  }
}
```

---

## Authentication Priority

```
1. Token Validation (if authToken exists)
   ↓ (if fails/missing)
2. Username + Credentials
   ↓ (if fails/missing)
3. Show Login Screen
```

---

## Token Validation (Optional but Recommended)

```javascript
const validateToken = async (token, supabaseUrl, supabaseKey) => {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/auth_tokens?token=eq.${token}&expires_at=gt.${new Date().toISOString()}&select=username,is_admin`,
    {
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    }
  );
  const tokens = await res.json();
  return tokens?.length > 0 ? tokens[0] : null;
};
```

---

## Available Data

| Field | Type | Always Present? |
|-------|------|----------------|
| `username` | string | Yes |
| `isAdmin` | boolean | Yes |
| `authToken` | string | No (may be null) |
| `SUPABASE_URL` | string | Yes |
| `SUPABASE_ANON_KEY` | string | Yes |
| `OPENAI_API_KEY` | string | No (may be null) |

---

## Common Mistakes

### ❌ Don't Require Token

```javascript
// BAD - Will fail for old sessions
if (!authToken) {
  showLoginScreen();
  return;
}
```

```javascript
// GOOD - Fallback to username
if (authToken) {
  await validateToken(authToken);
} else if (username) {
  // Use username-based auth
} else {
  showLoginScreen();
}
```

### ❌ Don't Forget to Store Credentials

```javascript
// BAD - Won't persist across reloads
const user = { username, isAdmin };
```

```javascript
// GOOD - Store in localStorage
if (username) localStorage.setItem('username', username);
if (isAdmin !== undefined) localStorage.setItem('isAdmin', String(isAdmin));
```

### ❌ Don't Forget Cleanup

```javascript
// BAD - Memory leak
window.addEventListener('message', handler);
```

```javascript
// GOOD - Clean up
window.addEventListener('message', handler);
// Later...
window.removeEventListener('message', handler);
```

---

## Debug Checklist

1. Open browser console
2. Look for postMessage logs
3. Check localStorage: `console.log(localStorage)`
4. Verify token: `console.log(localStorage.getItem('authToken')?.length)`
5. Test validation manually (see Token Validation section)

---

## Complete Minimal Example

**index.html:**

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <div id="loading">Loading...</div>
  <div id="app" style="display:none;">
    <h1 id="welcome"></h1>
  </div>
  <script src="auth.js"></script>
</body>
</html>
```

**auth.js:**

```javascript
(async () => {
  const auth = () => new Promise(resolve => {
    const h = async e => {
      if (e.data.type !== 'API_VALUES_RESPONSE') return;
      window.removeEventListener('message', h);
      const { authToken, username, isAdmin, SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY } = e.data.data;
      if (authToken) localStorage.setItem('authToken', authToken);
      if (username) localStorage.setItem('username', username);
      if (isAdmin !== undefined) localStorage.setItem('isAdmin', String(isAdmin));
      if (SUPABASE_URL) localStorage.setItem('SUPABASE_URL', SUPABASE_URL);
      if (SUPABASE_ANON_KEY) localStorage.setItem('SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);
      if (OPENAI_API_KEY) localStorage.setItem('OPENAI_API_KEY', OPENAI_API_KEY);
      resolve(username ? { username, isAdmin, authToken } : null);
    };
    window.addEventListener('message', h);
    if (window.self !== window.top) {
      window.parent.postMessage({ type: 'REQUEST_API_VALUES' }, '*');
      setTimeout(() => { window.removeEventListener('message', h); resolve(null); }, 2000);
    } else {
      window.removeEventListener('message', h);
      const u = localStorage.getItem('username');
      resolve(u ? { username: u, isAdmin: localStorage.getItem('isAdmin') === 'true' } : null);
    }
  });

  const user = await auth();
  document.getElementById('loading').style.display = 'none';
  if (user) {
    document.getElementById('welcome').textContent = `Welcome, ${user.username}!`;
    document.getElementById('app').style.display = 'block';
  } else {
    alert('Please log in');
  }
})();
```

---

## Need More Details?

See `IFRAME_INTEGRATION_GUIDE.md` for:
- Detailed explanations
- Security considerations
- Troubleshooting guide
- Testing procedures
- Best practices

---

**Last Updated:** 2026-02-15
