import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPPORTED_MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4o-2024-11-20",
  "gpt-4o-2024-08-06",
  "gpt-4o-mini-2024-07-18",
  "o1",
  "o1-mini",
  "o1-preview",
  "o3-mini",
  "gpt-4-turbo",
  "gpt-4-turbo-2024-04-09",
  "gpt-4",
  "gpt-3.5-turbo",
  "gpt-3.5-turbo-0125",
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: secretRow, error: secretError } = await supabase
      .from("secrets")
      .select("key_value")
      .eq("key_name", "OPENAI_API_KEY")
      .maybeSingle();

    if (secretError || !secretRow?.key_value) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = secretRow.key_value;
    const body = await req.json();
    const { model, ...rest } = body;

    if (!model || !SUPPORTED_MODELS.includes(model)) {
      return new Response(
        JSON.stringify({ error: `Unsupported model. Supported models: ${SUPPORTED_MODELS.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, ...rest }),
    });

    const data = await openaiRes.json();

    return new Response(JSON.stringify(data), {
      status: openaiRes.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
