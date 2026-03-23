import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPPORTED_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-pro-exp",
  "gemini-2.0-flash-thinking-exp",
  "gemini-1.5-pro",
  "gemini-1.5-pro-latest",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash-8b",
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
      .eq("key_name", "GEMINI_API_KEY")
      .maybeSingle();

    if (secretError || !secretRow?.key_value) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
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

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rest),
      }
    );

    const data = await geminiRes.json();

    EdgeRuntime.waitUntil(
      supabase.rpc("log_api_key_usage", {
        p_key_name: "GEMINI_API_KEY",
        p_proxy_name: "gemini-proxy",
      }).then(() => {})
    );

    return new Response(JSON.stringify(data), {
      status: geminiRes.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
