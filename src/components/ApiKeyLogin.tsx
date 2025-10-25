import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Key } from 'lucide-react';

interface ApiKeyLoginProps {
  onLogin: (apiKey: string) => void;
  onCancel: () => void;
}

export const ApiKeyLogin = ({ onLogin, onCancel }: ApiKeyLoginProps) => {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#5A7FBE]">
      <div className="relative w-full max-w-[640px]">
        <div
          className="border-[3px] rounded-lg overflow-hidden shadow-2xl"
          style={{
            borderTopColor: '#3C7DC9',
            borderLeftColor: '#3C7DC9',
            borderRightColor: '#16397E',
            borderBottomColor: '#16397E',
          }}
        >
          <div className="bg-gradient-to-b from-[#5A8FD8] to-[#5472B6] px-3 py-2">
            <h1 className="text-white text-base font-bold tracking-wide" style={{ fontFamily: 'Tahoma, sans-serif' }}>
              Log On to Educational AI Suite
            </h1>
          </div>

          <div className="bg-gradient-to-b from-[#6D92D6] to-[#5D7FC7] px-8 py-6 relative">
            <div className="flex items-center justify-center mb-4">
              <div className="text-center">
                <div className="text-white text-3xl font-bold mb-1" style={{ fontFamily: 'Trebuchet MS, sans-serif', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                  <span className="text-[#FF6B1A]">E</span>
                  <span className="text-[#80C241]">d</span>
                  <span className="text-[#FF6B1A]">u</span>
                  <span className="text-[#FFD800]">c</span>
                  <span className="text-[#FF6B1A]">a</span>
                  <span className="text-[#80C241]">t</span>
                  <span className="text-[#FF6B1A]">i</span>
                  <span className="text-[#FFD800]">o</span>
                  <span className="text-[#80C241]">n</span>
                  <span className="text-[#FF6B1A]">a</span>
                  <span className="text-[#80C241]">l</span>
                  <span className="ml-2 text-[#FF6B1A]">AI</span>
                </div>
                <div className="text-white text-xs" style={{ fontFamily: 'Tahoma, sans-serif' }}>Professional</div>
              </div>
            </div>

            <div className="text-white text-[10px] mb-4" style={{ fontFamily: 'Tahoma, sans-serif' }}>
              Copyright © 2025<br />
              Clarence's Solutions
            </div>

            <div className="absolute top-6 right-8">
              <img src="/src/assets/cla sol.png" alt="Clarence's Solutions" className="h-8 w-auto" />
            </div>
          </div>

          <div className="bg-[#D4D0C8] px-8 py-6">
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <label className="text-sm font-normal w-28" style={{ fontFamily: 'Tahoma, sans-serif' }}>
                  User name:
                </label>
                <input
                  type="text"
                  value="Administrator"
                  disabled
                  className="flex-1 px-2 py-1 border border-[#7F9DB9] bg-white text-sm"
                  style={{ fontFamily: 'Tahoma, sans-serif' }}
                />
              </div>

              <div className="flex items-center">
                <label className="text-sm font-normal w-28" style={{ fontFamily: 'Tahoma, sans-serif' }}>
                  Password:
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
                  className="flex-1 px-2 py-1 border border-[#7F9DB9] bg-white text-sm focus:outline-none focus:border-[#0054E3]"
                  style={{ fontFamily: 'Tahoma, sans-serif' }}
                  disabled={isValidating}
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 bg-[#FFF7CC] border border-[#FFD700] px-3 py-2 text-xs text-black">
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={handleLogin}
                disabled={isValidating || !apiKey}
                className="px-6 py-1.5 text-sm border-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="px-6 py-1.5 text-sm border-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

            <div className="mt-3 text-[10px] text-gray-600 text-center" style={{ fontFamily: 'Tahoma, sans-serif' }}>
              Enter your OpenAI API key (starts with sk-). This is optional and stored locally only.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
