import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Key } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { apiKeyStorage } from '@/lib/apiKeyStorage';
import { apiCache } from '@/lib/apiCache';
import { authTokenService } from '@/lib/authTokenService';

interface ApiKeyLoginProps {
  onLogin: (username: string, apiKey: string | null, isAdmin: boolean, userId?: string, authToken?: string) => void;
  onCancel: () => void;
}

export const ApiKeyLogin = ({ onLogin, onCancel }: ApiKeyLoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [usernames, setUsernames] = useState<string[]>([]);
  const [isLoadingUsernames, setIsLoadingUsernames] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const savedCredentials = localStorage.getItem('rememberedLogin');
    if (savedCredentials) {
      try {
        const { username: savedUsername, password: savedPassword } = JSON.parse(savedCredentials);
        if (savedUsername && savedPassword) {
          setUsername(savedUsername);
          setPassword(savedPassword);
          setRememberMe(true);
        }
      } catch (err) {
        console.error('Failed to load saved credentials:', err);
      }
    }
  }, []);

  useEffect(() => {
    const fetchUsernames = async () => {
      try {
        const { data, error } = await supabase
          .from('users_login')
          .select('username')
          .order('username', { ascending: true });

        if (error) {
          console.error('Error fetching usernames:', error);
        } else if (data) {
          setUsernames(data.map(u => u.username));
        }
      } catch (err) {
        console.error('Failed to load usernames:', err);
      } finally {
        setIsLoadingUsernames(false);
      }
    };

    fetchUsernames();
  }, []);

  const validateCredentials = async (user: string, pass: string): Promise<{ valid: boolean; apiKey: string | null; isAdmin: boolean; userId?: string }> => {
    if (!user || user.trim() === '' || !pass || pass.trim() === '') {
      setError('Please enter both username and password');
      return { valid: false, apiKey: null, isAdmin: false };
    }

    try {
      const { data, error: dbError } = await supabase
        .from('users_login')
        .select('id, username, password, api_key, is_admin')
        .eq('username', user)
        .maybeSingle();

      if (dbError) {
        console.error('Database error:', dbError);
        setError('Unable to validate credentials. Please try again.');
        return { valid: false, apiKey: null, isAdmin: false };
      }

      if (!data) {
        setError('Invalid username or password');
        return { valid: false, apiKey: null, isAdmin: false };
      }

      if (data.password !== pass) {
        setError('Invalid username or password');
        return { valid: false, apiKey: null, isAdmin: false };
      }

      return { valid: true, apiKey: data.api_key || null, isAdmin: data.is_admin || false, userId: data.id };
    } catch (err) {
      console.error('Error during login:', err);
      setError('Network error. Please check your connection.');
      return { valid: false, apiKey: null, isAdmin: false };
    }
  };

  const handleLogin = async () => {
    setError('');
    setIsValidating(true);

    const result = await validateCredentials(username, password);

    if (result.valid) {
      if (rememberMe) {
        localStorage.setItem('rememberedLogin', JSON.stringify({ username, password }));
      } else {
        localStorage.removeItem('rememberedLogin');
      }

      let generatedAuthToken: string | null = null;

      try {
        console.log('[Login] Generating auth token for user:', username);
        generatedAuthToken = await authTokenService.generateToken(username, result.isAdmin);

        if (generatedAuthToken) {
          console.log('[Login] Auth token generated successfully');
          apiKeyStorage.saveAuthToken(generatedAuthToken);
        } else {
          console.warn('[Login] Failed to generate auth token - proceeding without token');
        }

        const { data: secrets, error: secretsError } = await supabase
          .from('secrets')
          .select('key_name, key_value');

        if (!secretsError && secrets) {
          const apiKeys = {
            OPENAI_API_KEY: secrets.find(s => s.key_name === 'OPENAI_API_KEY')?.key_value || null,
            CLAUDE_API_KEY: secrets.find(s => s.key_name === 'CLAUDE_API_KEY' || s.key_name === 'ANTHROPIC_API_KEY')?.key_value || null,
            GEMINI_API_KEY: secrets.find(s => s.key_name === 'GEMINI_API_KEY')?.key_value || null,
            REPLICATE_API_KEY: secrets.find(s => s.key_name === 'REPLICATE_API_KEY')?.key_value || null,
          };

          apiKeyStorage.saveApiKeys(apiKeys);
          apiCache.saveAll({
            OPENAI_API_KEY: apiKeys.OPENAI_API_KEY,
            CLAUDE_API_KEY: apiKeys.CLAUDE_API_KEY,
            GEMINI_API_KEY: apiKeys.GEMINI_API_KEY,
            REPLICATE_API_KEY: apiKeys.REPLICATE_API_KEY,
            username: username,
            isAdmin: result.isAdmin,
          });
        }
      } catch (err) {
        console.error('[Login] Error during post-login setup:', err);
      }

      onLogin(username, result.apiKey, result.isAdmin, result.userId, generatedAuthToken || undefined);
    }

    setIsValidating(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
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
              Log On to Educational AI Suite
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
                  Username:
                </label>
                <select
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  onKeyDown={handleKeyPress}
                  className={`${isMobile ? 'w-full py-2' : 'flex-1'} px-2 py-1 border border-[#7F9DB9] bg-white ${isMobile ? 'text-xs' : 'text-xs'} focus:outline-none focus:border-[#0054E3]`}
                  style={{ fontFamily: 'Tahoma, sans-serif' }}
                  disabled={isValidating || isLoadingUsernames}
                  autoFocus
                >
                  <option value="">Select a username</option>
                  {usernames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={`flex items-center ${isMobile ? 'flex-col items-stretch' : ''}`}>
                <label className={`${isMobile ? 'text-xs mb-1.5' : 'text-xs w-20'} font-normal`} style={{ fontFamily: 'Tahoma, sans-serif' }}>
                  Password:
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  onKeyDown={handleKeyPress}
                  placeholder="Enter password"
                  className={`${isMobile ? 'w-full py-2' : 'flex-1'} px-2 py-1 border border-[#7F9DB9] bg-white ${isMobile ? 'text-xs' : 'text-xs'} focus:outline-none focus:border-[#0054E3]`}
                  style={{ fontFamily: 'Tahoma, sans-serif' }}
                  disabled={isValidating}
                />
              </div>

              <div className={`flex items-center mt-3 ${isMobile ? 'pl-0' : 'pl-20'}`}>
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => {
                    setRememberMe(e.target.checked);
                    if (!e.target.checked) {
                      localStorage.removeItem('rememberedLogin');
                    }
                  }}
                  disabled={isValidating}
                  className="mr-2 w-3.5 h-3.5 cursor-pointer"
                />
                <label
                  htmlFor="rememberMe"
                  className={`${isMobile ? 'text-xs' : 'text-xs'} font-normal cursor-pointer select-none`}
                  style={{ fontFamily: 'Tahoma, sans-serif' }}
                >
                  Remember my username and password
                </label>
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
                disabled={isValidating || !username || !password}
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
                {isValidating ? 'Logging in...' : 'OK'}
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
              Enter your username and password to access the system
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
