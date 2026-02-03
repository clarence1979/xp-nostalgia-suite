# React Hook Example for Iframe Programs

This document shows how to create a React hook that works with the existing instructions and the new API cache system.

## Complete React Hook Implementation

This hook is **fully backward compatible** with the existing instructions your iframe programs follow:

```typescript
import { useEffect, useState } from 'react';

interface ApiValues {
  OPENAI_API_KEY: string | null;
  CLAUDE_API_KEY: string | null;
  GEMINI_API_KEY: string | null;
  REPLICATE_API_KEY: string | null;
  SUPABASE_URL: string | null;
  SUPABASE_ANON_KEY: string | null;
  username: string | null;
  isAdmin: boolean;
}

function useApiValues() {
  const [apiValues, setApiValues] = useState<ApiValues>({
    OPENAI_API_KEY: null,
    CLAUDE_API_KEY: null,
    GEMINI_API_KEY: null,
    REPLICATE_API_KEY: null,
    SUPABASE_URL: null,
    SUPABASE_ANON_KEY: null,
    username: null,
    isAdmin: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Step 1: Check URL parameter (backward compatible)
    const urlParams = new URLSearchParams(window.location.search);
    const urlApiKey = urlParams.get('apiKey');

    if (urlApiKey) {
      // Store in both formats for compatibility
      localStorage.setItem('openai_api_key', urlApiKey);
      localStorage.setItem('OPENAI_API_KEY', urlApiKey);

      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete('apiKey');
      window.history.replaceState({}, document.title, url.toString());
    }

    // Step 2: Load from localStorage cache
    const loadFromCache = () => {
      const values = {
        OPENAI_API_KEY: localStorage.getItem('OPENAI_API_KEY') || localStorage.getItem('openai_api_key'),
        CLAUDE_API_KEY: localStorage.getItem('CLAUDE_API_KEY'),
        GEMINI_API_KEY: localStorage.getItem('GEMINI_API_KEY'),
        REPLICATE_API_KEY: localStorage.getItem('REPLICATE_API_KEY'),
        SUPABASE_URL: localStorage.getItem('SUPABASE_URL'),
        SUPABASE_ANON_KEY: localStorage.getItem('SUPABASE_ANON_KEY'),
        username: localStorage.getItem('username'),
        isAdmin: localStorage.getItem('isAdmin') === 'true',
      };

      setApiValues(values);
      return values;
    };

    // Step 3: Listen for messages from parent
    const handleMessage = (event: MessageEvent) => {
      // New format - all API values
      if (event.data.type === 'API_VALUES_RESPONSE' && event.data.data) {
        const values = event.data.data;

        // Save to localStorage (both formats for backward compatibility)
        localStorage.setItem('OPENAI_API_KEY', values.OPENAI_API_KEY || '');
        localStorage.setItem('openai_api_key', values.OPENAI_API_KEY || '');
        localStorage.setItem('CLAUDE_API_KEY', values.CLAUDE_API_KEY || '');
        localStorage.setItem('GEMINI_API_KEY', values.GEMINI_API_KEY || '');
        localStorage.setItem('REPLICATE_API_KEY', values.REPLICATE_API_KEY || '');
        localStorage.setItem('SUPABASE_URL', values.SUPABASE_URL || '');
        localStorage.setItem('SUPABASE_ANON_KEY', values.SUPABASE_ANON_KEY || '');
        localStorage.setItem('username', values.username || '');
        localStorage.setItem('isAdmin', String(values.isAdmin));

        setApiValues(values);
        setIsLoading(false);
      }

      // Legacy format - OpenAI key only (backward compatible)
      if (event.data.type === 'API_KEY_RESPONSE' && event.data.apiKey) {
        localStorage.setItem('openai_api_key', event.data.apiKey);
        localStorage.setItem('OPENAI_API_KEY', event.data.apiKey);

        setApiValues(prev => ({
          ...prev,
          OPENAI_API_KEY: event.data.apiKey,
        }));
        setIsLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);

    // Step 4: Request from parent if running in iframe
    if (window.parent !== window) {
      // Request all values (new method)
      window.parent.postMessage({ type: 'REQUEST_API_VALUES' }, '*');

      // Also send legacy request for backward compatibility
      window.parent.postMessage({ type: 'REQUEST_API_KEY' }, '*');
    }

    // Step 5: Load initial values from cache
    const cachedValues = loadFromCache();

    // If we have cached values, we're ready
    if (cachedValues.OPENAI_API_KEY || cachedValues.SUPABASE_URL) {
      setIsLoading(false);
    } else {
      // Wait for parent response
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return { ...apiValues, isLoading };
}

export default useApiValues;
```

## Usage in Your Component

This is **exactly compatible** with the existing instructions:

```typescript
import { useState, useEffect } from 'react';
import useApiValues from './hooks/useApiValues';

function MyProgram() {
  const { OPENAI_API_KEY, CLAUDE_API_KEY, GEMINI_API_KEY, username, isLoading } = useApiValues();
  const [apiKey, setApiKey] = useState('');

  // Auto-populate API key (backward compatible with existing instructions)
  useEffect(() => {
    if (OPENAI_API_KEY) {
      setApiKey(OPENAI_API_KEY);
    }
  }, [OPENAI_API_KEY]);

  if (isLoading) {
    return <div>Loading API configuration...</div>;
  }

  return (
    <div>
      <h1>Welcome {username || 'Guest'}</h1>

      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="API Key will auto-populate if available"
      />

      {CLAUDE_API_KEY && (
        <div>Claude API Key available</div>
      )}

      {GEMINI_API_KEY && (
        <div>Gemini API Key available</div>
      )}
    </div>
  );
}
```

## Simplified Version (OpenAI Only)

If you only need the OpenAI key (matches the original instructions exactly):

```typescript
import { useEffect, useState } from 'react';

function useApiKey() {
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    // Check URL parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const urlApiKey = urlParams.get('apiKey');

    if (urlApiKey) {
      localStorage.setItem('openai_api_key', urlApiKey);
      setApiKey(urlApiKey);

      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete('apiKey');
      window.history.replaceState({}, document.title, url.toString());
    } else {
      // Fall back to localStorage
      const storedKey = localStorage.getItem('openai_api_key');
      setApiKey(storedKey);
    }

    // Listen for parent messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'API_KEY_RESPONSE' && event.data.apiKey) {
        localStorage.setItem('openai_api_key', event.data.apiKey);
        setApiKey(event.data.apiKey);
      }

      if (event.data.type === 'API_VALUES_RESPONSE' && event.data.data?.OPENAI_API_KEY) {
        localStorage.setItem('openai_api_key', event.data.data.OPENAI_API_KEY);
        setApiKey(event.data.data.OPENAI_API_KEY);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return apiKey;
}

// Usage in your component (exactly as in the original instructions):
function App() {
  const apiKey = useApiKey();

  useEffect(() => {
    if (apiKey) {
      // Set your form field value here
      console.log('API Key loaded:', apiKey);
    }
  }, [apiKey]);

  return (
    <input
      type="password"
      value={apiKey || ''}
      placeholder="API Key will auto-populate"
    />
  );
}
```

## Alternative: Using the apiKeyStorage Utility

You can also use the existing `apiKeyStorage` utility (if available in your iframe):

```typescript
import { apiKeyStorage } from '@/lib/apiKeyStorage';

// Get the OpenAI API key
const apiKey = apiKeyStorage.get();

// Get all API keys
const apiKeys = apiKeyStorage.getApiKeys();
```

## Summary

This implementation is **100% backward compatible** with the existing instructions:

✅ Supports URL parameter method (`?apiKey=...`)
✅ Stores in `localStorage` as `openai_api_key`
✅ Auto-cleans the URL after extracting the key
✅ Supports the `apiKeyStorage.get()` utility
✅ **PLUS**: Now also receives all other API keys and user info
✅ **PLUS**: Works with both legacy and new postMessage formats

**No changes needed** to existing iframe programs - they will continue working exactly as before while automatically gaining access to additional API values if needed.
