import { useRef, useEffect } from 'react';
import { apiKeyStorage } from '@/lib/apiKeyStorage';
import { apiCache } from '@/lib/apiCache';
import { supabase } from '@/integrations/supabase/client';

interface IframeProgramProps {
  url: string;
  title: string;
}

export const IframeProgram = ({ url, title }: IframeProgramProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const sendApiValuesToIframe = async () => {
    if (iframeRef.current?.contentWindow) {
      let allApiValues = apiCache.getAll();
      const session = apiKeyStorage.getSession();
      let apiKeys = apiKeyStorage.getApiKeys();

      if (!apiKeys.OPENAI_API_KEY && !apiKeys.CLAUDE_API_KEY && !apiKeys.GEMINI_API_KEY && !apiKeys.REPLICATE_API_KEY) {
        try {
          const { data: secrets, error } = await supabase
            .from('secrets')
            .select('key_name, key_value');

          if (!error && secrets) {
            const fetchedKeys = {
              OPENAI_API_KEY: secrets.find(s => s.key_name === 'OPENAI_API_KEY')?.key_value || '',
              CLAUDE_API_KEY: secrets.find(s => s.key_name === 'CLAUDE_API_KEY' || s.key_name === 'ANTHROPIC_API_KEY')?.key_value || '',
              GEMINI_API_KEY: secrets.find(s => s.key_name === 'GEMINI_API_KEY')?.key_value || '',
              REPLICATE_API_KEY: secrets.find(s => s.key_name === 'REPLICATE_API_KEY')?.key_value || '',
            };

            apiKeyStorage.saveApiKeys(fetchedKeys);
            apiCache.saveAll(fetchedKeys);
            apiKeys = fetchedKeys;
          }
        } catch (err) {
          console.error('Failed to fetch API keys:', err);
        }
      }

      const authToken = apiKeyStorage.getAuthToken();

      allApiValues = {
        ...allApiValues,
        OPENAI_API_KEY: apiKeys.OPENAI_API_KEY || '',
        CLAUDE_API_KEY: apiKeys.CLAUDE_API_KEY || '',
        GEMINI_API_KEY: apiKeys.GEMINI_API_KEY || '',
        REPLICATE_API_KEY: apiKeys.REPLICATE_API_KEY || '',
        username: session?.username || allApiValues.username || '',
        isAdmin: session?.isAdmin || allApiValues.isAdmin || false,
        authToken: authToken || '',
      };

      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage(
          {
            type: 'API_VALUES_RESPONSE',
            data: allApiValues,
            apiKey: allApiValues.OPENAI_API_KEY
          },
          '*'
        );

        iframeRef.current?.contentWindow?.postMessage(
          {
            type: 'API_KEY_RESPONSE',
            apiKey: allApiValues.OPENAI_API_KEY
          },
          '*'
        );

        if (allApiValues.REPLICATE_API_KEY) {
          iframeRef.current?.contentWindow?.postMessage(
            {
              type: 'replicate-api-key',
              key: allApiValues.REPLICATE_API_KEY
            },
            '*'
          );
        }
      }, 500);
    }
  };

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.addEventListener('load', sendApiValuesToIframe);
      return () => {
        iframeRef.current?.removeEventListener('load', sendApiValuesToIframe);
      };
    }
  }, [url]);

  return (
    <iframe
      ref={iframeRef}
      src={url}
      className="w-full h-full border-none"
      title={title}
      allow="camera *; microphone *; geolocation *; fullscreen *; payment *; usb *; accelerometer *; gyroscope *; magnetometer *; display-capture *; clipboard-read *; clipboard-write *; web-share *; autoplay *; encrypted-media *; picture-in-picture *; midi *"
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals allow-orientation-lock allow-pointer-lock allow-presentation allow-storage-access-by-user-activation allow-top-navigation allow-top-navigation-by-user-activation"
    />
  );
};
