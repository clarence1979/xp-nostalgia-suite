import { supabase } from '@/integrations/supabase/client';

const API_KEY_STORAGE_KEY = 'openai_api_key';
const USER_SESSION_KEY = 'user_session';
const AUTH_TOKEN_KEY = 'auth_token';

const OPENAI_KEY = 'OPENAI_API_KEY';
const CLAUDE_KEY = 'CLAUDE_API_KEY';
const GEMINI_KEY = 'GEMINI_API_KEY';
const REPLICATE_KEY = 'REPLICATE_API_KEY';

interface UserSession {
  username: string;
  userId?: string;
  apiKey: string | null;
  isAdmin: boolean;
  authToken?: string;
}

interface ApiKeys {
  OPENAI_API_KEY: string | null;
  CLAUDE_API_KEY: string | null;
  GEMINI_API_KEY: string | null;
  REPLICATE_API_KEY: string | null;
}

export const apiKeyStorage = {
  save: (apiKey: string): void => {
    try {
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    } catch (error) {
      console.error('Failed to save API key:', error);
    }
  },

  get: (): string | null => {
    try {
      return localStorage.getItem(API_KEY_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to retrieve API key:', error);
      return null;
    }
  },

  clear: (): void => {
    try {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
      localStorage.removeItem(USER_SESSION_KEY);
    } catch (error) {
      console.error('Failed to clear API key:', error);
    }
  },

  exists: (): boolean => {
    return apiKeyStorage.get() !== null;
  },

  saveSession: (username: string, apiKey: string | null, isAdmin: boolean = false, authToken?: string, userId?: string): void => {
    try {
      const session: UserSession = { username, userId, apiKey, isAdmin, authToken };
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
      if (apiKey) {
        localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
      }
      if (authToken) {
        localStorage.setItem(AUTH_TOKEN_KEY, authToken);
      }
    } catch (error) {
      console.error('Failed to save user session:', error);
    }
  },

  getSession: (): UserSession | null => {
    try {
      const sessionStr = localStorage.getItem(USER_SESSION_KEY);
      if (!sessionStr) return null;
      return JSON.parse(sessionStr);
    } catch (error) {
      console.error('Failed to retrieve user session:', error);
      return null;
    }
  },

  clearSession: (): void => {
    try {
      localStorage.removeItem(USER_SESSION_KEY);
      localStorage.removeItem(API_KEY_STORAGE_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(OPENAI_KEY);
      localStorage.removeItem(CLAUDE_KEY);
      localStorage.removeItem(GEMINI_KEY);
      localStorage.removeItem(REPLICATE_KEY);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  },

  saveApiKeys: (keys: ApiKeys): void => {
    try {
      if (keys.OPENAI_API_KEY) {
        localStorage.setItem(OPENAI_KEY, keys.OPENAI_API_KEY);
        localStorage.setItem(API_KEY_STORAGE_KEY, keys.OPENAI_API_KEY);
      }
      if (keys.CLAUDE_API_KEY) {
        localStorage.setItem(CLAUDE_KEY, keys.CLAUDE_API_KEY);
      }
      if (keys.GEMINI_API_KEY) {
        localStorage.setItem(GEMINI_KEY, keys.GEMINI_API_KEY);
      }
      if (keys.REPLICATE_API_KEY) {
        localStorage.setItem(REPLICATE_KEY, keys.REPLICATE_API_KEY);
      }
    } catch (error) {
      console.error('Failed to save API keys:', error);
    }
  },

  getApiKeys: (): ApiKeys => {
    try {
      return {
        OPENAI_API_KEY: localStorage.getItem(OPENAI_KEY),
        CLAUDE_API_KEY: localStorage.getItem(CLAUDE_KEY),
        GEMINI_API_KEY: localStorage.getItem(GEMINI_KEY),
        REPLICATE_API_KEY: localStorage.getItem(REPLICATE_KEY),
      };
    } catch (error) {
      console.error('Failed to retrieve API keys:', error);
      return {
        OPENAI_API_KEY: null,
        CLAUDE_API_KEY: null,
        GEMINI_API_KEY: null,
        REPLICATE_API_KEY: null,
      };
    }
  },

  fetchFreshApiKeys: async (): Promise<ApiKeys> => {
    try {
      const { data: secrets, error } = await supabase
        .from('secrets')
        .select('key_name, key_value');

      if (error || !secrets) {
        return apiKeyStorage.getApiKeys();
      }

      const fresh: ApiKeys = {
        OPENAI_API_KEY: secrets.find(s => s.key_name === 'OPENAI_API_KEY')?.key_value || null,
        CLAUDE_API_KEY: secrets.find(s => s.key_name === 'CLAUDE_API_KEY' || s.key_name === 'ANTHROPIC_API_KEY')?.key_value || null,
        GEMINI_API_KEY: secrets.find(s => s.key_name === 'GEMINI_API_KEY')?.key_value || null,
        REPLICATE_API_KEY: secrets.find(s => s.key_name === 'REPLICATE_API_KEY')?.key_value || null,
      };

      const writeOrClear = (storageKey: string, value: string | null) => {
        if (value) localStorage.setItem(storageKey, value);
        else localStorage.removeItem(storageKey);
      };
      writeOrClear(OPENAI_KEY, fresh.OPENAI_API_KEY);
      writeOrClear(API_KEY_STORAGE_KEY, fresh.OPENAI_API_KEY);
      writeOrClear(CLAUDE_KEY, fresh.CLAUDE_API_KEY);
      writeOrClear(GEMINI_KEY, fresh.GEMINI_API_KEY);
      writeOrClear(REPLICATE_KEY, fresh.REPLICATE_API_KEY);

      return fresh;
    } catch (err) {
      console.error('Failed to fetch fresh API keys from Supabase:', err);
      return apiKeyStorage.getApiKeys();
    }
  },

  getApiKey: (keyName: string): string | null => {
    try {
      return localStorage.getItem(keyName);
    } catch (error) {
      console.error(`Failed to retrieve ${keyName}:`, error);
      return null;
    }
  },

  getAuthToken: (): string | null => {
    try {
      const session = apiKeyStorage.getSession();
      const token = session?.authToken || localStorage.getItem(AUTH_TOKEN_KEY);
      console.log('[ApiKeyStorage] Retrieved auth token:', {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        fromSession: !!session?.authToken,
        fromStorage: !!localStorage.getItem(AUTH_TOKEN_KEY)
      });
      return token;
    } catch (error) {
      console.error('Failed to retrieve auth token:', error);
      return null;
    }
  },

  saveAuthToken: (token: string): void => {
    try {
      console.log('[ApiKeyStorage] Saving auth token, length:', token.length);
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      const session = apiKeyStorage.getSession();
      if (session) {
        session.authToken = token;
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
        console.log('[ApiKeyStorage] Token saved to both storage and session');
      } else {
        console.log('[ApiKeyStorage] Token saved to storage only (no session)');
      }
    } catch (error) {
      console.error('Failed to save auth token:', error);
    }
  }
};
