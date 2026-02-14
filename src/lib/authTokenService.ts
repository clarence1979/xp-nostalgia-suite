import { supabase } from '@/integrations/supabase/client';

export interface AuthTokenData {
  username: string;
  isAdmin: boolean;
  token: string;
  expiresAt: string;
}

export const authTokenService = {
  generateToken: async (username: string, isAdmin: boolean): Promise<string | null> => {
    try {
      const token = crypto.randomUUID() + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2);

      const { error } = await supabase
        .from('auth_tokens')
        .insert({
          username,
          token,
          is_admin: isAdmin,
        });

      if (error) {
        console.error('Failed to create auth token:', error);
        return null;
      }

      return token;
    } catch (err) {
      console.error('Error generating auth token:', err);
      return null;
    }
  },

  validateToken: async (token: string): Promise<AuthTokenData | null> => {
    try {
      const { data, error } = await supabase
        .from('auth_tokens')
        .select('username, is_admin, token, expires_at')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      await supabase
        .from('auth_tokens')
        .update({ last_used_at: new Date().toISOString() })
        .eq('token', token);

      return {
        username: data.username,
        isAdmin: data.is_admin || false,
        token: data.token,
        expiresAt: data.expires_at,
      };
    } catch (err) {
      console.error('Error validating auth token:', err);
      return null;
    }
  },

  cleanupExpiredTokens: async (): Promise<void> => {
    try {
      await supabase.rpc('cleanup_expired_tokens');
    } catch (err) {
      console.error('Error cleaning up expired tokens:', err);
    }
  },

  revokeToken: async (token: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('auth_tokens')
        .delete()
        .eq('token', token);

      return !error;
    } catch (err) {
      console.error('Error revoking token:', err);
      return false;
    }
  },

  revokeUserTokens: async (username: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('auth_tokens')
        .delete()
        .eq('username', username);

      return !error;
    } catch (err) {
      console.error('Error revoking user tokens:', err);
      return false;
    }
  },
};
