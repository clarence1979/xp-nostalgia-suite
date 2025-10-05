import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NOTEPAD_ID = '00000000-0000-0000-0000-000000000001';

// Password constants - stored server-side for security
const VIEW_ONLY_PASSWORD = 'PVCC123';
const WRITE_ACCESS_PASSWORD = 'PVCC321';

// Helper function to validate password and return access level
function validatePassword(password: string): { valid: boolean; accessLevel: 'view' | 'write' | null } {
  if (password === WRITE_ACCESS_PASSWORD) {
    return { valid: true, accessLevel: 'write' };
  } else if (password === VIEW_ONLY_PASSWORD) {
    return { valid: true, accessLevel: 'view' };
  }
  return { valid: false, accessLevel: null };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { password, action, content } = await req.json();

    // Validate password and get access level
    const { valid, accessLevel } = validatePassword(password);
    
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

    // Handle GET request (read content)
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

    // Handle UPDATE request (save content)
    if (action === 'update') {
      // Check if user has write access
      if (accessLevel !== 'write') {
        console.log('Write access denied for view-only user');
        return new Response(
          JSON.stringify({ error: 'Access denied: View-only access. Use password PVCC321 for write access.' }),
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