# API Values Access for Iframe Programs

This document explains how iframe programs running inside the main application can access API values.

## Overview

The main application stores all API values in localStorage cache and makes them available to iframe programs through two methods:

1. **Direct localStorage access** (if same-origin)
2. **PostMessage communication** (for cross-origin iframes)

## Available API Values

The following values are cached and available to iframe programs:

```typescript
{
  OPENAI_API_KEY: string | null;
  CLAUDE_API_KEY: string | null;
  GEMINI_API_KEY: string | null;
  REPLICATE_API_KEY: string | null;
  SUPABASE_URL: string | null;
  SUPABASE_ANON_KEY: string | null;
  username: string | null;
  isAdmin: boolean;
  authToken: string | null;
}
```

### Authentication Token (authToken)

The `authToken` is a secure session token that allows iframe programs to authenticate users without requiring them to log in again. This token:

- Is automatically generated when a user logs in
- Expires after 24 hours
- Cannot be read from URLs or browser cache by third parties
- Can be validated server-side using Supabase
- Does NOT contain passwords or sensitive credentials

## Method 1: Direct localStorage Access (Same-Origin)

If your iframe program runs on the same origin as the main application, you can directly access the values from localStorage:

```javascript
// Get individual values (new format)
const openaiKey = localStorage.getItem('OPENAI_API_KEY');
const claudeKey = localStorage.getItem('CLAUDE_API_KEY');
const geminiKey = localStorage.getItem('GEMINI_API_KEY');
const replicateKey = localStorage.getItem('REPLICATE_API_KEY');
const supabaseUrl = localStorage.getItem('SUPABASE_URL');
const supabaseAnonKey = localStorage.getItem('SUPABASE_ANON_KEY');
const username = localStorage.getItem('username');
const isAdmin = localStorage.getItem('isAdmin') === 'true';

// Backward compatibility: OpenAI key is also stored in the old format
const openaiKeyLegacy = localStorage.getItem('openai_api_key');

// Or get all values at once
const apiCache = JSON.parse(localStorage.getItem('api_cache') || '{}');
```

### Using the apiKeyStorage Utility (Backward Compatible)

The existing method using `apiKeyStorage` still works:

```javascript
import { apiKeyStorage } from '@/lib/apiKeyStorage';

// Get the OpenAI API key (works as before)
const apiKey = apiKeyStorage.get();

// Get all API keys
const apiKeys = apiKeyStorage.getApiKeys();
// Returns: { OPENAI_API_KEY, CLAUDE_API_KEY, GEMINI_API_KEY, REPLICATE_API_KEY }
```

## Method 2: PostMessage Communication (Cross-Origin)

If your iframe program runs on a different origin, use the postMessage API:

### Step 1: Request API values from parent

```javascript
// New method (recommended) - request all API values
window.parent.postMessage({ type: 'REQUEST_API_VALUES' }, '*');

// Legacy method (still works) - request just OpenAI key
window.parent.postMessage({ type: 'REQUEST_API_KEY' }, '*');
```

### Step 2: Listen for response

```javascript
// Listen for the response
window.addEventListener('message', (event) => {
  // New format - all API values
  if (event.data.type === 'API_VALUES_RESPONSE') {
    const apiValues = event.data.data;

    // Store in localStorage for future use
    localStorage.setItem('OPENAI_API_KEY', apiValues.OPENAI_API_KEY || '');
    localStorage.setItem('openai_api_key', apiValues.OPENAI_API_KEY || ''); // Backward compatibility
    localStorage.setItem('CLAUDE_API_KEY', apiValues.CLAUDE_API_KEY || '');
    localStorage.setItem('GEMINI_API_KEY', apiValues.GEMINI_API_KEY || '');
    localStorage.setItem('REPLICATE_API_KEY', apiValues.REPLICATE_API_KEY || '');
    localStorage.setItem('SUPABASE_URL', apiValues.SUPABASE_URL || '');
    localStorage.setItem('SUPABASE_ANON_KEY', apiValues.SUPABASE_ANON_KEY || '');
    localStorage.setItem('username', apiValues.username || '');
    localStorage.setItem('isAdmin', String(apiValues.isAdmin));

    // Use the values
    console.log('Received API values:', apiValues);
  }

  // Legacy format (still supported) - OpenAI key only
  if (event.data.type === 'API_KEY_RESPONSE' && event.data.apiKey) {
    localStorage.setItem('openai_api_key', event.data.apiKey);
    console.log('Received API key:', event.data.apiKey);
  }
});
```

## Method 3: Using the Helper Library (Recommended)

For convenience, you can use the provided helper library that handles both methods automatically:

```javascript
import { iframeApiHelper } from '@/lib/iframeApiHelper';

// Initialize and get all API values
async function initializeApp() {
  const apiValues = await iframeApiHelper.initializeForIframe();

  console.log('OpenAI Key:', apiValues.OPENAI_API_KEY);
  console.log('Claude Key:', apiValues.CLAUDE_API_KEY);
  console.log('Gemini Key:', apiValues.GEMINI_API_KEY);
  console.log('Replicate Key:', apiValues.REPLICATE_API_KEY);
  console.log('Supabase URL:', apiValues.SUPABASE_URL);
  console.log('Supabase Anon Key:', apiValues.SUPABASE_ANON_KEY);
  console.log('Username:', apiValues.username);
  console.log('Is Admin:', apiValues.isAdmin);

  // Now you can use these values in your app
}

// Call on app load
initializeApp();
```

## Automatic Value Updates

When the parent application loads an iframe program, it automatically sends the API values via postMessage after the iframe loads. This means your iframe will receive the values without explicitly requesting them.

However, it's still recommended to implement the request mechanism as a fallback in case the automatic send fails.

## Example: Complete Implementation

Here's a complete example of how to implement API value access in your iframe program:

```javascript
// iframe-program.js

let apiValues = null;

// Try to get from localStorage first (same-origin)
function getFromCache() {
  return {
    OPENAI_API_KEY: localStorage.getItem('OPENAI_API_KEY') || localStorage.getItem('openai_api_key'),
    CLAUDE_API_KEY: localStorage.getItem('CLAUDE_API_KEY'),
    GEMINI_API_KEY: localStorage.getItem('GEMINI_API_KEY'),
    REPLICATE_API_KEY: localStorage.getItem('REPLICATE_API_KEY'),
    SUPABASE_URL: localStorage.getItem('SUPABASE_URL'),
    SUPABASE_ANON_KEY: localStorage.getItem('SUPABASE_ANON_KEY'),
    username: localStorage.getItem('username'),
    isAdmin: localStorage.getItem('isAdmin') === 'true',
  };
}

// Request from parent (cross-origin)
function requestFromParent() {
  return new Promise((resolve) => {
    const handleMessage = (event) => {
      if (event.data.type === 'API_VALUES_RESPONSE') {
        window.removeEventListener('message', handleMessage);

        const values = event.data.data;

        // Save to localStorage (both new and old formats for backward compatibility)
        localStorage.setItem('OPENAI_API_KEY', values.OPENAI_API_KEY || '');
        localStorage.setItem('openai_api_key', values.OPENAI_API_KEY || '');
        localStorage.setItem('CLAUDE_API_KEY', values.CLAUDE_API_KEY || '');
        localStorage.setItem('GEMINI_API_KEY', values.GEMINI_API_KEY || '');
        localStorage.setItem('REPLICATE_API_KEY', values.REPLICATE_API_KEY || '');
        localStorage.setItem('SUPABASE_URL', values.SUPABASE_URL || '');
        localStorage.setItem('SUPABASE_ANON_KEY', values.SUPABASE_ANON_KEY || '');
        localStorage.setItem('username', values.username || '');
        localStorage.setItem('isAdmin', String(values.isAdmin));

        resolve(values);
      }
    };

    window.addEventListener('message', handleMessage);

    // Send request to parent
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'REQUEST_API_VALUES' }, '*');
    }

    // Timeout after 2 seconds
    setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      resolve(getFromCache());
    }, 2000);
  });
}

// Initialize
async function initialize() {
  // Try cache first
  apiValues = getFromCache();

  // If no values in cache, request from parent
  if (!apiValues.OPENAI_API_KEY && !apiValues.SUPABASE_URL) {
    apiValues = await requestFromParent();
  }

  console.log('API Values initialized:', apiValues);

  // Now start your application with the API values
  startApp(apiValues);
}

// Call on page load
initialize();
```

## Backward Compatibility

The cache system maintains full backward compatibility with existing iframe programs:

### Existing Programs Continue to Work

If your iframe program already uses any of these methods, no changes are required:

1. **URL Parameter Method**: OpenAI key passed via `?apiKey=...` still works
2. **localStorage Access**: `localStorage.getItem('openai_api_key')` still works
3. **apiKeyStorage Utility**: `apiKeyStorage.get()` still works
4. **postMessage Legacy**: `REQUEST_API_KEY` and `API_KEY_RESPONSE` still work

### New Programs Get Enhanced Access

New iframe programs can access all available API keys and values:

```javascript
// Access all keys at once
const cache = apiCache.getAll();

// Or request them all via postMessage
window.parent.postMessage({ type: 'REQUEST_API_VALUES' }, '*');
```

### Storage Format

The OpenAI API key is stored in both formats:
- `OPENAI_API_KEY` - New format (uppercase)
- `openai_api_key` - Legacy format (lowercase)

Both will always contain the same value, ensuring compatibility.

## Validating Authentication Token in Iframe Programs

To validate the user's authentication without requiring them to log in again, use the provided `authToken`:

### Method 1: Using the Auth Token Service (Recommended)

```javascript
import { authTokenService } from '@/lib/authTokenService';

async function validateUser(authToken) {
  const tokenData = await authTokenService.validateToken(authToken);

  if (tokenData) {
    console.log('User authenticated:', tokenData.username);
    console.log('Is admin:', tokenData.isAdmin);
    // User is authenticated, proceed with app
    return tokenData;
  } else {
    console.log('Invalid or expired token');
    // Token is invalid, prompt for login
    return null;
  }
}

// Get token from postMessage
window.addEventListener('message', async (event) => {
  if (event.data.type === 'API_VALUES_RESPONSE') {
    const authToken = event.data.data.authToken;

    if (authToken) {
      const userData = await validateUser(authToken);
      if (userData) {
        // User is authenticated, start your app
        initializeApp(userData);
      }
    }
  }
});
```

### Method 2: Direct Supabase Query

```javascript
async function validateToken(token) {
  const { data, error } = await supabase
    .from('auth_tokens')
    .select('username, is_admin, expires_at')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    username: data.username,
    isAdmin: data.is_admin,
  };
}
```

### Complete Example: Auto-Login with Auth Token

```javascript
// In your iframe program
let currentUser = null;

async function attemptAutoLogin() {
  // First, request API values from parent
  window.parent.postMessage({ type: 'REQUEST_API_VALUES' }, '*');

  // Wait for response
  return new Promise((resolve) => {
    const handleMessage = async (event) => {
      if (event.data.type === 'API_VALUES_RESPONSE') {
        window.removeEventListener('message', handleMessage);

        const authToken = event.data.data.authToken;

        if (authToken) {
          // Validate the token
          const response = await fetch(supabaseUrl + '/rest/v1/auth_tokens?token=eq.' + authToken + '&expires_at=gt.' + new Date().toISOString(), {
            headers: {
              'apikey': supabaseAnonKey,
              'Content-Type': 'application/json',
            }
          });

          const tokens = await response.json();

          if (tokens && tokens.length > 0) {
            currentUser = {
              username: tokens[0].username,
              isAdmin: tokens[0].is_admin,
            };

            console.log('Auto-login successful:', currentUser.username);
            resolve(currentUser);
          } else {
            console.log('Token validation failed');
            resolve(null);
          }
        } else {
          console.log('No auth token received');
          resolve(null);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Timeout after 2 seconds
    setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      resolve(null);
    }, 2000);
  });
}

// Use it in your app initialization
async function initApp() {
  const user = await attemptAutoLogin();

  if (user) {
    // User is authenticated, proceed
    console.log('Welcome back,', user.username);
    showMainApp();
  } else {
    // No valid token, show login screen
    showLoginScreen();
  }
}

// Start app
initApp();
```

## Security Considerations

1. The postMessage API uses `'*'` as the target origin for compatibility. In production, consider restricting this to specific origins.
2. Never log or expose API keys in production environments.
3. Store API keys securely and never commit them to version control.
4. The main application ensures API keys are encrypted in the database and only accessible to authenticated users.
5. **Authentication Tokens**:
   - Tokens expire after 24 hours automatically
   - Tokens are validated server-side to prevent tampering
   - Tokens do not contain passwords or sensitive data
   - Always validate tokens on the server before trusting them
   - Tokens are passed via postMessage (in-memory only), never in URLs or query parameters
