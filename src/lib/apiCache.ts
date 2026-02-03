interface ApiCache {
  OPENAI_API_KEY: string | null;
  CLAUDE_API_KEY: string | null;
  GEMINI_API_KEY: string | null;
  REPLICATE_API_KEY: string | null;
  SUPABASE_URL: string | null;
  SUPABASE_ANON_KEY: string | null;
  username: string | null;
  isAdmin: boolean;
}

const API_CACHE_KEY = 'api_cache';

export const apiCache = {
  saveAll: (data: Partial<ApiCache>): void => {
    try {
      const existing = apiCache.getAll();
      const updated = { ...existing, ...data };
      localStorage.setItem(API_CACHE_KEY, JSON.stringify(updated));

      if (data.OPENAI_API_KEY) {
        localStorage.setItem('OPENAI_API_KEY', data.OPENAI_API_KEY);
        localStorage.setItem('openai_api_key', data.OPENAI_API_KEY);
      }
      if (data.CLAUDE_API_KEY) localStorage.setItem('CLAUDE_API_KEY', data.CLAUDE_API_KEY);
      if (data.GEMINI_API_KEY) localStorage.setItem('GEMINI_API_KEY', data.GEMINI_API_KEY);
      if (data.REPLICATE_API_KEY) localStorage.setItem('REPLICATE_API_KEY', data.REPLICATE_API_KEY);
      if (data.SUPABASE_URL) localStorage.setItem('SUPABASE_URL', data.SUPABASE_URL);
      if (data.SUPABASE_ANON_KEY) localStorage.setItem('SUPABASE_ANON_KEY', data.SUPABASE_ANON_KEY);
      if (data.username) localStorage.setItem('username', data.username);
      if (data.isAdmin !== undefined) localStorage.setItem('isAdmin', String(data.isAdmin));
    } catch (error) {
      console.error('Failed to save API cache:', error);
    }
  },

  getAll: (): ApiCache => {
    try {
      const cached = localStorage.getItem(API_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }

      return {
        OPENAI_API_KEY: localStorage.getItem('OPENAI_API_KEY'),
        CLAUDE_API_KEY: localStorage.getItem('CLAUDE_API_KEY'),
        GEMINI_API_KEY: localStorage.getItem('GEMINI_API_KEY'),
        REPLICATE_API_KEY: localStorage.getItem('REPLICATE_API_KEY'),
        SUPABASE_URL: localStorage.getItem('SUPABASE_URL'),
        SUPABASE_ANON_KEY: localStorage.getItem('SUPABASE_ANON_KEY'),
        username: localStorage.getItem('username'),
        isAdmin: localStorage.getItem('isAdmin') === 'true',
      };
    } catch (error) {
      console.error('Failed to retrieve API cache:', error);
      return {
        OPENAI_API_KEY: null,
        CLAUDE_API_KEY: null,
        GEMINI_API_KEY: null,
        REPLICATE_API_KEY: null,
        SUPABASE_URL: null,
        SUPABASE_ANON_KEY: null,
        username: null,
        isAdmin: false,
      };
    }
  },

  get: (key: keyof ApiCache): string | boolean | null => {
    try {
      const cache = apiCache.getAll();
      return cache[key];
    } catch (error) {
      console.error(`Failed to retrieve ${key} from cache:`, error);
      return null;
    }
  },

  clear: (): void => {
    try {
      localStorage.removeItem(API_CACHE_KEY);
      localStorage.removeItem('OPENAI_API_KEY');
      localStorage.removeItem('openai_api_key');
      localStorage.removeItem('CLAUDE_API_KEY');
      localStorage.removeItem('GEMINI_API_KEY');
      localStorage.removeItem('REPLICATE_API_KEY');
      localStorage.removeItem('SUPABASE_URL');
      localStorage.removeItem('SUPABASE_ANON_KEY');
      localStorage.removeItem('username');
      localStorage.removeItem('isAdmin');
    } catch (error) {
      console.error('Failed to clear API cache:', error);
    }
  },

  initializeSupabaseValues: (): void => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      apiCache.saveAll({
        SUPABASE_URL: supabaseUrl,
        SUPABASE_ANON_KEY: supabaseAnonKey,
      });
    }
  }
};
