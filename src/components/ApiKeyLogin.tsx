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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-[#5a7fbe] to-[#4a6fa5]">
      <div className="relative w-full max-w-md">
        <div
          className="bg-[hsl(var(--button-face))] border-2 shadow-[inset_1px_1px_0px_rgba(255,255,255,0.8),inset_-1px_-1px_0px_rgba(0,0,0,0.3)] rounded"
          style={{
            borderTopColor: 'hsl(var(--button-highlight))',
            borderLeftColor: 'hsl(var(--button-highlight))',
            borderRightColor: 'hsl(var(--button-shadow))',
            borderBottomColor: 'hsl(var(--button-shadow))',
          }}
        >
          <div
            className="bg-gradient-to-r from-[#0054e3] to-[#3c8df5] text-white px-2 py-1 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              <span className="font-bold text-sm">OpenAI API Key Login</span>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-white border-2 border-[hsl(var(--button-shadow))] p-4 mb-4">
              <p className="text-sm mb-2">
                Enter your OpenAI API key to automatically populate it across all AI-powered programs.
              </p>
              <p className="text-xs text-gray-600">
                This is optional and can be skipped by clicking Cancel.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">API Key:</label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setError('');
                }}
                onKeyDown={handleKeyPress}
                placeholder="sk-..."
                className="xp-input"
                disabled={isValidating}
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-300 p-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <Button
                onClick={handleLogin}
                disabled={isValidating || !apiKey}
                className="xp-button min-w-[80px]"
              >
                {isValidating ? 'Validating...' : 'OK'}
              </Button>
              <Button
                onClick={onCancel}
                variant="outline"
                disabled={isValidating}
                className="xp-button min-w-[80px]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-white text-xs">
          <p className="drop-shadow-md">Your API key is stored locally and never sent to our servers</p>
        </div>
      </div>
    </div>
  );
};
