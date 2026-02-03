const API_KEY_STORAGE_KEY = 'openai_api_key';
const USER_SESSION_KEY = 'user_session';

const OPENAI_KEY = 'OPENAI_API_KEY';
const CLAUDE_KEY = 'CLAUDE_API_KEY';
const GEMINI_KEY = 'GEMINI_API_KEY';
const REPLICATE_KEY = 'REPLICATE_API_KEY';

interface UserSession {
  username: string;
  apiKey: string | null;
  isAdmin: boolean;
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

  saveSession: (username: string, apiKey: string | null, isAdmin: boolean = false): void => {
    try {
      const session: UserSession = { username, apiKey, isAdmin };
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
      if (apiKey) {
        localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
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

  getApiKey: (keyName: string): string | null => {
    try {
      return localStorage.getItem(keyName);
    } catch (error) {
      console.error(`Failed to retrieve ${keyName}:`, error);
      return null;
    }
  }
};
