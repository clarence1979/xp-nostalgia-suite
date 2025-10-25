const API_KEY_STORAGE_KEY = 'openai_api_key';

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
    } catch (error) {
      console.error('Failed to clear API key:', error);
    }
  },

  exists: (): boolean => {
    return apiKeyStorage.get() !== null;
  }
};
