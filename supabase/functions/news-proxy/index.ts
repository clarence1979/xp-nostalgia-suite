import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const NEWS_API_KEY = "bb1197fd4bd84890b04cadafe05dfdbe";
const BASE = "https://newsapi.org/v2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") ?? "top";
    const category = url.searchParams.get("category") ?? "";
    const pageSize = url.searchParams.get("pageSize") ?? "20";

    let apiUrl: string;

    if (type === "local") {
      apiUrl = `${BASE}/everything?q=Melbourne+OR+Victoria+OR+Australia&language=en&sortBy=publishedAt&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`;
    } else if (type === "category" && category) {
      apiUrl = `${BASE}/top-headlines?country=au&category=${encodeURIComponent(category)}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`;
    } else {
      // default: top headlines for Australia
      apiUrl = `${BASE}/top-headlines?country=au&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`;
    }

    const res = await fetch(apiUrl, {
      headers: { "User-Agent": "DesktopWidget/1.0" },
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
