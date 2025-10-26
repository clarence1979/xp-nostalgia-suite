import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Key } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ApiKeyLoginProps {
  onLogin: (apiKey: string) => void;
  onCancel: () => void;
}

export const ApiKeyLogin = ({ onLogin, onCancel }: ApiKeyLoginProps) => {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const isMobile = useIsMobile();

  const validateApiKey = async (key: string): Promise<boolean> => {
    if (!key || key.trim() === '') {
      return false;
    }

    if (!key.startsWith('sk-')) {
      setError('Invalid API key format. OpenAI keys start with "sk-"');
      return false;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${key}`,
        },
      });

      if (response.ok) {
        return true;
      } else if (response.status === 401) {
        setError('Invalid API key. Please check and try again.');
        return false;
      } else {
        setError('Unable to validate API key. Please try again.');
        return false;
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
      return false;
    }
  };

  const handleLogin = async () => {
    setError('');
    setIsValidating(true);

    const isValid = await validateApiKey(apiKey);

    setIsValidating(false);

    if (isValid) {
      onLogin(apiKey);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#5A7FBE] p-4">
      <div className={`relative w-full ${isMobile ? 'max-w-[95vw]' : 'max-w-[400px]'}`}>
        <div
          className="border-[3px] rounded-lg overflow-hidden shadow-2xl"
          style={{
            borderTopColor: '#3C7DC9',
            borderLeftColor: '#3C7DC9',
            borderRightColor: '#16397E',
            borderBottomColor: '#16397E',
          }}
        >
          <div className={`bg-gradient-to-b from-[#5A8FD8] to-[#5472B6] ${isMobile ? 'px-3 py-2' : 'px-3 py-1.5'}`}>
            <h1 className={`text-white ${isMobile ? 'text-sm' : 'text-sm'} font-bold`} style={{ fontFamily: 'Tahoma, sans-serif' }}>
              API Key Configuration
            </h1>
          </div>

          <div className={`bg-gradient-to-b from-[#6D92D6] to-[#5D7FC7] ${isMobile ? 'px-4 py-5' : 'px-6 py-4'} relative`}>
            <div className={`flex items-center ${isMobile ? 'flex-col' : 'justify-between'}`}>
              <div className={`text-center ${isMobile ? 'flex-1 mb-3' : 'flex-1'}`}>
                <div className={`text-white ${isMobile ? 'text-lg' : 'text-xl'} font-bold mb-1`} style={{ fontFamily: 'Segoe UI, Tahoma, sans-serif', letterSpacing: '0.5px' }}>
                  Educational AI Suite
                </div>
                <div className={`text-white/80 ${isMobile ? 'text-xs' : 'text-xs'} mb-1`} style={{ fontFamily: 'Tahoma, sans-serif' }}>Professional Edition</div>
                <div className={`text-white/70 ${isMobile ? 'text-[10px]' : 'text-[9px]'}`} style={{ fontFamily: 'Tahoma, sans-serif' }}>
                  © 2025 Clarence's Solutions
                </div>
              </div>
              <div className={`${isMobile ? '' : 'ml-3'}`}>
                <img src="/cla-sol.png" alt="Clarence's Solutions" className={`${isMobile ? 'h-12' : 'h-10'} w-auto`} />
              </div>
            </div>
          </div>

          <div className={`bg-[#D4D0C8] ${isMobile ? 'px-4 py-5' : 'px-6 py-4'}`}>
            <div className="mb-4">
              <div className={`flex items-center mb-3 ${isMobile ? 'flex-col items-stretch' : ''}`}>
                <label className={`${isMobile ? 'text-xs mb-1.5' : 'text-xs w-20'} font-normal`} style={{ fontFamily: 'Tahoma, sans-serif' }}>
                  User:
                </label>
                <input
                  type="text"
                  value="Administrator"
                  disabled
                  className={`${isMobile ? 'w-full py-2' : 'flex-1'} px-2 py-1 border border-[#7F9DB9] bg-white ${isMobile ? 'text-xs' : 'text-xs'}`}
                  style={{ fontFamily: 'Tahoma, sans-serif' }}
                />
              </div>

              <div className={`flex items-center ${isMobile ? 'flex-col items-stretch' : ''}`}>
                <label className={`${isMobile ? 'text-xs mb-1.5' : 'text-xs w-20'} font-normal`} style={{ fontFamily: 'Tahoma, sans-serif' }}>
                  API Key:
                </label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setError('');
                  }}
                  onKeyDown={handleKeyPress}
                  placeholder="sk-..."
                  className={`${isMobile ? 'w-full py-2' : 'flex-1'} px-2 py-1 border border-[#7F9DB9] bg-white ${isMobile ? 'text-xs' : 'text-xs'} focus:outline-none focus:border-[#0054E3]`}
                  style={{ fontFamily: 'Tahoma, sans-serif' }}
                  disabled={isValidating}
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className={`mb-4 bg-[#FFF7CC] border border-[#FFD700] px-3 py-2 ${isMobile ? 'text-[10px]' : 'text-[10px]'} text-black`}>
                {error}
              </div>
            )}

            <div className={`flex gap-2 justify-end ${isMobile ? 'flex-col-reverse' : ''}`}>
              <button
                onClick={handleLogin}
                disabled={isValidating || !apiKey}
                className={`${isMobile ? 'w-full py-2.5 text-sm' : 'px-5 py-1 text-xs'} border-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{
                  fontFamily: 'Tahoma, sans-serif',
                  background: '#ECE9D8',
                  borderTopColor: '#FFFFFF',
                  borderLeftColor: '#FFFFFF',
                  borderRightColor: '#808080',
                  borderBottomColor: '#808080',
                }}
              >
                {isValidating ? 'Validating...' : 'OK'}
              </button>
              <button
                onClick={onCancel}
                disabled={isValidating}
                className={`${isMobile ? 'w-full py-2.5 text-sm' : 'px-5 py-1 text-xs'} border-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{
                  fontFamily: 'Tahoma, sans-serif',
                  background: '#ECE9D8',
                  borderTopColor: '#FFFFFF',
                  borderLeftColor: '#FFFFFF',
                  borderRightColor: '#808080',
                  borderBottomColor: '#808080',
                }}
              >
                Cancel
              </button>
            </div>

            <div className={`mt-3 ${isMobile ? 'text-[9px]' : 'text-[9px]'} text-gray-600 text-center`} style={{ fontFamily: 'Tahoma, sans-serif' }}>
              OpenAI API key (optional) - Stored locally
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
