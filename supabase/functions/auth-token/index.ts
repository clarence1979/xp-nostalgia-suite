import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface GenerateTokenRequest {
  username: string;
  password: string;
}

interface ValidateUserResponse {
  username: string;
  is_admin: boolean;
}

async function validateUser(
  supabase: any,
  username: string,
  password: string
): Promise<ValidateUserResponse | null> {
  try {
    const { data, error } = await supabase
      .from('users_login')
      .select('username, is_admin, password')
      .eq('username', username)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    // Direct password comparison (passwords are stored as plain text for educational purposes)
    if (data.password !== password) {
      return null;
    }

    return {
      username: data.username,
      is_admin: data.is_admin || false,
    };
  } catch (err) {
    console.error('Error validating user:', err);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    if (req.method === 'POST' && action === 'generate') {
      const { username, password }: GenerateTokenRequest = await req.json();

      if (!username || !password) {
        return new Response(
          JSON.stringify({ error: 'Username and password are required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Validate user credentials
      const user = await validateUser(supabase, username, password);

      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Invalid credentials' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Generate secure token
      const token = crypto.randomUUID() + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2);

      // Insert token using service role (bypasses RLS)
      const { error } = await supabase
        .from('auth_tokens')
        .insert({
          username: user.username,
          token,
          is_admin: user.is_admin,
        });

      if (error) {
        console.error('Failed to create auth token:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to create token' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          token,
          username: user.username,
          isAdmin: user.is_admin,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (req.method === 'DELETE' && action === 'revoke') {
      const { token } = await req.json();

      if (!token) {
        return new Response(
          JSON.stringify({ error: 'Token is required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { error } = await supabase
        .from('auth_tokens')
        .delete()
        .eq('token', token);

      if (error) {
        console.error('Failed to revoke token:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to revoke token' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid endpoint or method' }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Server error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
