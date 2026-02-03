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

export const iframeApiHelper = {
  getFromCache: (): ApiValues => {
    try {
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
      console.error('Failed to retrieve API values from cache:', error);
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

  requestFromParent: (): Promise<ApiValues> => {
    return new Promise((resolve) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'API_VALUES_RESPONSE' && event.data.data) {
          window.removeEventListener('message', handleMessage);

          const values = event.data.data;
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

      if (window.parent !== window) {
        window.parent.postMessage({ type: 'REQUEST_API_VALUES' }, '*');
      }

      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        resolve(iframeApiHelper.getFromCache());
      }, 2000);
    });
  },

  initializeForIframe: async (): Promise<ApiValues> => {
    const cachedValues = iframeApiHelper.getFromCache();

    if (cachedValues.OPENAI_API_KEY || cachedValues.SUPABASE_URL) {
      return cachedValues;
    }

    return await iframeApiHelper.requestFromParent();
  }
};
