import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const NOTEPAD_ID = '00000000-0000-0000-0000-000000000001';

async function validatePassword(
  supabase: any,
  password: string
): Promise<{ valid: boolean; accessLevel: 'view' | 'write' | null }> {
  try {
    const { data, error } = await supabase.rpc('validate_notepad_password', {
      input_password: password
    });

    if (error) {
      console.error('Error validating password:', error);
      return { valid: false, accessLevel: null };
    }

    if (data && data.length > 0) {
      const result = data[0];
      return {
        valid: result.is_valid,
        accessLevel: result.is_valid ? result.access_level : null
      };
    }

    return { valid: false, accessLevel: null };
  } catch (err) {
    console.error('Exception validating password:', err);
    return { valid: false, accessLevel: null };
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

    const { password, action, content } = await req.json();

    const { valid, accessLevel } = await validatePassword(supabase, password);
    
    if (!valid) {
      console.log('Invalid password attempt');
      return new Response(
        JSON.stringify({ error: 'Access denied: Invalid password' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Notepad ${action} request with ${accessLevel} access`);

    if (action === 'get') {
      const { data, error } = await supabase
        .from('notepad')
        .select('content')
        .eq('id', NOTEPAD_ID)
        .single();

      if (error) {
        console.error('Error fetching notepad:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          content: data.content,
          accessLevel: accessLevel 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (action === 'update') {
      if (accessLevel !== 'write') {
        console.log('Write access denied for view-only user');
        return new Response(
          JSON.stringify({ error: 'Access denied: View-only access. Contact administrator for write access.' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (content === undefined) {
        return new Response(
          JSON.stringify({ error: 'Content is required for update' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const { error } = await supabase
        .from('notepad')
        .update({ content })
        .eq('id', NOTEPAD_ID);

      if (error) {
        console.error('Error updating notepad:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "get" or "update"' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Server error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});