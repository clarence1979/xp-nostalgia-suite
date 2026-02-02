import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Key } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

interface ApiKeyLoginProps {
  onLogin: (username: string, apiKey: string | null) => void;
  onCancel: () => void;
}

export const ApiKeyLogin = ({ onLogin, onCancel }: ApiKeyLoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [usernames, setUsernames] = useState<string[]>([]);
  const [isLoadingUsernames, setIsLoadingUsernames] = useState(true);
  const isMobile = useIsMobile();

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

  const validateCredentials = async (user: string, pass: string): Promise<{ valid: boolean; apiKey: string | null }> => {
    if (!user || user.trim() === '' || !pass || pass.trim() === '') {
      setError('Please enter both username and password');
      return { valid: false, apiKey: null };
    }

    try {
      const { data, error: dbError } = await supabase
        .from('users_login')
        .select('username, password, api_key')
        .eq('username', user)
        .maybeSingle();

      if (dbError) {
        console.error('Database error:', dbError);
        setError('Unable to validate credentials. Please try again.');
        return { valid: false, apiKey: null };
      }

      if (!data) {
        setError('Invalid username or password');
        return { valid: false, apiKey: null };
      }

      if (data.password !== pass) {
        setError('Invalid username or password');
        return { valid: false, apiKey: null };
      }

      return { valid: true, apiKey: data.api_key || null };
    } catch (err) {
      console.error('Error during login:', err);
      setError('Network error. Please check your connection.');
      return { valid: false, apiKey: null };
    }
  };

  const handleLogin = async () => {
    setError('');
    setIsValidating(true);

    const result = await validateCredentials(username, password);

    setIsValidating(false);

    if (result.valid) {
      onLogin(username, result.apiKey);
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
