const API_KEY_STORAGE_KEY = 'openai_api_key';
const USER_SESSION_KEY = 'user_session';

interface UserSession {
  username: string;
  apiKey: string | null;
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

  saveSession: (username: string, apiKey: string | null): void => {
    try {
      const session: UserSession = { username, apiKey };
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
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }
};
