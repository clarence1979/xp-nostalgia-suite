import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const API_KEY = "c2fcec9e768a7a1087518cb41f52ef0c";
const BASE = "https://api.openweathermap.org/data/2.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function owmToWmo(id: number): number {
  if (id >= 200 && id < 300) return 95;
  if (id >= 300 && id < 400) return 53;
  if (id >= 500 && id < 600) return 63;
  if (id >= 600 && id < 700) return 73;
  if (id >= 700 && id < 800) return 45;
  if (id === 800) return 0;
  if (id === 801) return 1;
  if (id === 802) return 2;
  if (id >= 803) return 3;
  return 0;
}

function fmtTime(dt: number, tz: number): string {
  const d = new Date((dt + tz) * 1000);
  return d.toISOString().slice(0, 16);
}

function fmtDay(dt: number, tz: number): string {
  const d = new Date((dt + tz) * 1000);
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const lat = url.searchParams.get("latitude") ?? "-37.8136";
    const lon = url.searchParams.get("longitude") ?? "144.9631";

    const [currentRes, forecastRes] = await Promise.all([
      fetch(`${BASE}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
      fetch(`${BASE}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
    ]);

    if (!currentRes.ok) {
      const err = await currentRes.text();
      return new Response(JSON.stringify({ error: `Current API: ${currentRes.status} ${err}` }), {
        status: currentRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!forecastRes.ok) {
      const err = await forecastRes.text();
      return new Response(JSON.stringify({ error: `Forecast API: ${forecastRes.status} ${err}` }), {
        status: forecastRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const current = await currentRes.json();
    const forecast = await forecastRes.json();
    const tz = current.timezone;

    const hourlyTimes: string[] = [];
    const hourlyTemp: number[] = [];
    const hourlyHumidity: number[] = [];
    const hourlyWind: number[] = [];
    const hourlyCode: number[] = [];

    for (const item of forecast.list) {
      hourlyTimes.push(fmtTime(item.dt, tz));
      hourlyTemp.push(item.main.temp);
      hourlyHumidity.push(item.main.humidity);
      hourlyWind.push(item.wind.speed * 3.6);
      hourlyCode.push(owmToWmo(item.weather[0].id));
    }

    const dailyMap = new Map<string, { temps: number[]; codes: number[] }>();
    for (const item of forecast.list) {
      const day = fmtDay(item.dt, tz);
      if (!dailyMap.has(day)) dailyMap.set(day, { temps: [], codes: [] });
      const d = dailyMap.get(day)!;
      d.temps.push(item.main.temp);
      d.codes.push(item.weather[0].id);
    }

    const today = fmtDay(current.dt, tz);
    const dailyTimes: string[] = [];
    const dailyMax: number[] = [];
    const dailyMin: number[] = [];
    const dailyCodes: number[] = [];

    for (const [day, d] of dailyMap) {
      dailyTimes.push(day);
      dailyMax.push(Math.max(...d.temps));
      dailyMin.push(Math.min(...d.temps));
      const mostCommon = d.codes.sort((a, b) =>
        d.codes.filter(v => v === a).length - d.codes.filter(v => v === b).length
      ).pop()!;
      dailyCodes.push(owmToWmo(mostCommon));
    }

    if (!dailyTimes.includes(today)) {
      dailyTimes.unshift(today);
      dailyMax.unshift(current.main.temp_max);
      dailyMin.unshift(current.main.temp_min);
      dailyCodes.unshift(owmToWmo(current.weather[0].id));
    }

    const result = {
      current: {
        time: fmtTime(current.dt, tz),
        temperature_2m: current.main.temp,
        relative_humidity_2m: current.main.humidity,
        apparent_temperature: current.main.feels_like,
        weather_code: owmToWmo(current.weather[0].id),
        wind_speed_10m: current.wind.speed * 3.6,
        surface_pressure: current.main.pressure,
        visibility: current.visibility ?? 10000,
        cloud_cover: current.clouds.all,
        uv_index: 0,
      },
      hourly: {
        time: hourlyTimes,
        temperature_2m: hourlyTemp,
        relative_humidity_2m: hourlyHumidity,
        wind_speed_10m: hourlyWind,
        weather_code: hourlyCode,
      },
      daily: {
        time: dailyTimes,
        weather_code: dailyCodes,
        temperature_2m_max: dailyMax,
        temperature_2m_min: dailyMin,
      },
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
