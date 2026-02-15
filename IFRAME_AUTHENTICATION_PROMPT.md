# Authentication Prompt for Iframe Programs

## Prompt to Give to Your Iframe Application

Use this prompt when building iframe applications that need to integrate with the main desktop environment authentication system:

---

**AUTHENTICATION INTEGRATION REQUIREMENTS:**

Your application will run inside an iframe within a desktop environment that has its own authentication system. Users have already logged in to the main desktop, and you need to automatically log them into your application without requiring them to enter credentials again.

**AUTHENTICATION DATA YOU WILL RECEIVE:**

When your iframe loads, the parent window will automatically send you authentication data via postMessage containing:

```javascript
{
  type: 'API_VALUES_RESPONSE',
  data: {
    authToken: string,        // Secure session token (24-hour expiry)
    username: string,          // The logged-in username
    isAdmin: boolean,          // Whether the user has admin privileges
    OPENAI_API_KEY: string,    // Optional: OpenAI API key
    CLAUDE_API_KEY: string,    // Optional: Claude API key
    GEMINI_API_KEY: string,    // Optional: Gemini API key
    REPLICATE_API_KEY: string, // Optional: Replicate API key
    SUPABASE_URL: string,      // Supabase database URL
    SUPABASE_ANON_KEY: string  // Supabase anonymous key
  }
}
```

**IMPLEMENTATION REQUIREMENTS:**

1. **Listen for Authentication Data**: Set up a message listener on page load to receive the authentication data from the parent window.

2. **Auto-Login**: When you receive the `authToken`, automatically log the user into your application without showing a login screen.

3. **Token Validation**: Validate the `authToken` by querying the Supabase database to ensure it's valid and not expired.

4. **Fallback**: If no valid token is received within 2 seconds, show a login screen.

5. **Store Credentials**: Save the received credentials to localStorage for persistence across page reloads.

**REQUIRED CODE IMPLEMENTATION:**

Add this code to your application (runs automatically on page load):

```javascript
// Authentication handler for iframe integration
let currentUser = null;

async function handleParentAuthentication() {
  return new Promise((resolve) => {
    const messageHandler = async (event) => {
      if (event.data.type === 'API_VALUES_RESPONSE') {
        window.removeEventListener('message', messageHandler);

        const { authToken, username, isAdmin, SUPABASE_URL, SUPABASE_ANON_KEY } = event.data.data;

        // Store credentials in localStorage
        if (authToken) localStorage.setItem('authToken', authToken);
        if (username) localStorage.setItem('username', username);
        if (isAdmin !== undefined) localStorage.setItem('isAdmin', String(isAdmin));
        if (SUPABASE_URL) localStorage.setItem('SUPABASE_URL', SUPABASE_URL);
        if (SUPABASE_ANON_KEY) localStorage.setItem('SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);

        // Validate the auth token
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
              currentUser = {
                username: tokens[0].username,
                isAdmin: tokens[0].is_admin,
                authToken: authToken
              };

              console.log('Auto-login successful:', currentUser.username);
              resolve(currentUser);
              return;
            }
          } catch (error) {
            console.error('Token validation failed:', error);
          }
        }

        resolve(null);
      }
    };

    window.addEventListener('message', messageHandler);

    // Request authentication data from parent
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'REQUEST_API_VALUES' }, '*');
    }

    // Timeout after 2 seconds - show login screen if no response
    setTimeout(() => {
      window.removeEventListener('message', messageHandler);

      // Try to load from localStorage as fallback
      const storedToken = localStorage.getItem('authToken');
      const storedUsername = localStorage.getItem('username');
      const storedIsAdmin = localStorage.getItem('isAdmin') === 'true';

      if (storedToken && storedUsername) {
        currentUser = {
          username: storedUsername,
          isAdmin: storedIsAdmin,
          authToken: storedToken
        };
        resolve(currentUser);
      } else {
        resolve(null);
      }
    }, 2000);
  });
}

// Initialize app with authentication
async function initializeApp() {
  const user = await handleParentAuthentication();

  if (user) {
    // User is authenticated - show main application
    console.log(`Welcome back, ${user.username}!`);
    showMainApp(user);
  } else {
    // No valid authentication - show login screen
    showLoginScreen();
  }
}

// Start the app
initializeApp();
```

**REACT IMPLEMENTATION:**

If you're using React, use this hook:

```javascript
import { useEffect, useState } from 'react';

function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleAuthentication = async () => {
      const messageHandler = async (event) => {
        if (event.data.type === 'API_VALUES_RESPONSE') {
          const { authToken, username, isAdmin, SUPABASE_URL, SUPABASE_ANON_KEY } = event.data.data;

          if (authToken) localStorage.setItem('authToken', authToken);
          if (username) localStorage.setItem('username', username);
          if (isAdmin !== undefined) localStorage.setItem('isAdmin', String(isAdmin));
          if (SUPABASE_URL) localStorage.setItem('SUPABASE_URL', SUPABASE_URL);
          if (SUPABASE_ANON_KEY) localStorage.setItem('SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);

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
                setUser({
                  username: tokens[0].username,
                  isAdmin: tokens[0].is_admin,
                  authToken: authToken
                });
                setIsLoading(false);
                return;
              }
            } catch (error) {
              console.error('Token validation failed:', error);
            }
          }

          setIsLoading(false);
        }
      };

      window.addEventListener('message', messageHandler);

      if (window.parent !== window) {
        window.parent.postMessage({ type: 'REQUEST_API_VALUES' }, '*');
      }

      setTimeout(() => {
        window.removeEventListener('message', messageHandler);

        const storedToken = localStorage.getItem('authToken');
        const storedUsername = localStorage.getItem('username');
        const storedIsAdmin = localStorage.getItem('isAdmin') === 'true';

        if (storedToken && storedUsername) {
          setUser({
            username: storedUsername,
            isAdmin: storedIsAdmin,
            authToken: storedToken
          });
        }

        setIsLoading(false);
      }, 2000);

      return () => window.removeEventListener('message', messageHandler);
    };

    handleAuthentication();
  }, []);

  return { user, isLoading };
}

// Usage in your component:
function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div>
      <h1>Welcome, {user.username}!</h1>
      {user.isAdmin && <AdminPanel />}
      <MainApp user={user} />
    </div>
  );
}
```

**SECURITY REQUIREMENTS:**

1. NEVER store passwords - only use the provided authToken
2. ALWAYS validate the authToken against the database before trusting it
3. Tokens expire after 24 hours - handle expired tokens gracefully
4. If token validation fails, show the login screen
5. NEVER log or expose the authToken in production

**USER EXPERIENCE REQUIREMENTS:**

1. The authentication should be seamless - users should NOT see a login screen if they're already logged in to the desktop
2. Show a loading state while validating the token (max 2 seconds)
3. If auto-login fails, show your normal login screen
4. Display the username somewhere in your UI to confirm who is logged in
5. Provide a logout button that clears localStorage

**TESTING:**

Test these scenarios:
1. User opens your app for the first time (should auto-login)
2. User refreshes the page (should stay logged in via localStorage)
3. User opens app after 24+ hours (token expired, should show login)
4. App opened outside the desktop environment (no parent, should show login)

---

## Example Complete Application

Here's a minimal working example:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Iframe App with Auto-Login</title>
</head>
<body>
  <div id="app">
    <div id="loading">Connecting to desktop...</div>
    <div id="login" style="display: none;">
      <h2>Login</h2>
      <input type="text" id="username" placeholder="Username">
      <input type="password" id="password" placeholder="Password">
      <button onclick="login()">Login</button>
    </div>
    <div id="main" style="display: none;">
      <h1>Welcome, <span id="user-name"></span>!</h1>
      <p>You are logged in.</p>
      <button onclick="logout()">Logout</button>
    </div>
  </div>

  <script>
    let currentUser = null;

    async function handleParentAuthentication() {
      return new Promise((resolve) => {
        const messageHandler = async (event) => {
          if (event.data.type === 'API_VALUES_RESPONSE') {
            window.removeEventListener('message', messageHandler);

            const { authToken, username, isAdmin, SUPABASE_URL, SUPABASE_ANON_KEY } = event.data.data;

            if (authToken) localStorage.setItem('authToken', authToken);
            if (username) localStorage.setItem('username', username);
            if (isAdmin !== undefined) localStorage.setItem('isAdmin', String(isAdmin));
            if (SUPABASE_URL) localStorage.setItem('SUPABASE_URL', SUPABASE_URL);
            if (SUPABASE_ANON_KEY) localStorage.setItem('SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);

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
                  currentUser = {
                    username: tokens[0].username,
                    isAdmin: tokens[0].is_admin,
                    authToken: authToken
                  };

                  resolve(currentUser);
                  return;
                }
              } catch (error) {
                console.error('Token validation failed:', error);
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

          const storedToken = localStorage.getItem('authToken');
          const storedUsername = localStorage.getItem('username');
          const storedIsAdmin = localStorage.getItem('isAdmin') === 'true';

          if (storedToken && storedUsername) {
            currentUser = {
              username: storedUsername,
              isAdmin: storedIsAdmin,
              authToken: storedToken
            };
            resolve(currentUser);
          } else {
            resolve(null);
          }
        }, 2000);
      });
    }

    async function initializeApp() {
      const user = await handleParentAuthentication();

      document.getElementById('loading').style.display = 'none';

      if (user) {
        showMainApp(user);
      } else {
        showLoginScreen();
      }
    }

    function showMainApp(user) {
      document.getElementById('user-name').textContent = user.username;
      document.getElementById('main').style.display = 'block';
    }

    function showLoginScreen() {
      document.getElementById('login').style.display = 'block';
    }

    function login() {
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      // Implement your own login logic here
      console.log('Manual login:', username);

      currentUser = { username, isAdmin: false };
      localStorage.setItem('username', username);

      document.getElementById('login').style.display = 'none';
      showMainApp(currentUser);
    }

    function logout() {
      localStorage.clear();
      currentUser = null;
      document.getElementById('main').style.display = 'none';
      showLoginScreen();
    }

    // Start the app
    initializeApp();
  </script>
</body>
</html>
```

## Summary

Implement the authentication handler on page load. Your app will automatically receive authentication credentials from the parent window and should log the user in without any manual input. If no valid credentials are received, fall back to showing a login screen.
