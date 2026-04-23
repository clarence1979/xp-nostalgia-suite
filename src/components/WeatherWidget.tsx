import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

const LAT = -37.8136;
const LON = 144.9631;
const REFRESH_MS = 15 * 60 * 1000;

function wmoInfo(code: number): { emoji: string; desc: string } {
  if (code === 0) return { emoji: '☀️', desc: 'Clear sky' };
  if (code === 1) return { emoji: '🌤️', desc: 'Mainly clear' };
  if (code === 2) return { emoji: '⛅', desc: 'Partly cloudy' };
  if (code === 3) return { emoji: '☁️', desc: 'Overcast' };
  if (code <= 48) return { emoji: '🌫️', desc: 'Foggy' };
  if (code <= 55) return { emoji: '🌦️', desc: 'Drizzle' };
  if (code <= 65) return { emoji: '🌧️', desc: 'Rain' };
  if (code <= 75) return { emoji: '❄️', desc: 'Snow' };
  if (code <= 82) return { emoji: '🌦️', desc: 'Showers' };
  if (code <= 99) return { emoji: '⛈️', desc: 'Thunderstorm' };
  return { emoji: '🌡️', desc: 'Unknown' };
}

function fmtHour(t: string) {
  return new Date(t + ':00').toLocaleTimeString('en-AU', { hour: 'numeric', hour12: true });
}

function fmtDay(t: string) {
  return new Date(t + 'T00:00:00').toLocaleDateString('en-AU', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });
}

interface WeatherData {
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
    surface_pressure: number;
    visibility: number;
    cloud_cover: number;
    uv_index: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    wind_speed_10m: number[];
    weather_code: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}

const XP = {
  bg: 'rgba(236,233,216,0.97)',
  headerBg: 'linear-gradient(180deg,#2868D9 0%,#1247BA 100%)',
  headerText: '#fff',
  headerSub: 'rgba(255,255,255,0.7)',
  headerUpdated: 'rgba(255,255,255,0.6)',
  body: '#1c1c1c',
  muted: '#555',
  sectionBg: 'rgba(255,255,255,0.7)',
  sectionBorder: '1px solid #c8c8c8',
  divider: '#d0d0d0',
  border: '2px solid #7BABD4',
  accent: '#245EDC',
  hourlyBg: 'rgba(255,255,255,0.8)',
  statBg: 'rgba(37,94,220,0.08)',
  toggleActive: '#245EDC',
  toggleActiveText: '#fff',
  toggleInactive: 'rgba(255,255,255,0.6)',
  toggleInactiveText: '#444',
  chartGrid: '#e0e0e0',
  chartHumidity: '#1565c0',
  chartWind: '#2e7d32',
  tooltipBg: '#fff',
  retryBg: '#245EDC',
};

const KALI = {
  bg: 'rgba(8,8,8,0.95)',
  headerBg: 'rgba(0,20,20,0.85)',
  headerText: 'hsl(180 100% 70%)',
  headerSub: 'rgba(0,255,255,0.55)',
  headerUpdated: 'rgba(0,255,255,0.45)',
  body: '#cef3f3',
  muted: '#80deea',
  sectionBg: 'rgba(0,255,255,0.04)',
  sectionBorder: '1px solid rgba(0,255,255,0.15)',
  divider: 'rgba(0,255,255,0.12)',
  border: '1px solid rgba(0,255,255,0.3)',
  accent: '#00e5ff',
  hourlyBg: 'rgba(0,255,255,0.06)',
  statBg: 'rgba(0,255,255,0.06)',
  toggleActive: 'rgba(0,100,100,0.9)',
  toggleActiveText: 'hsl(180 100% 70%)',
  toggleInactive: 'rgba(0,255,255,0.08)',
  toggleInactiveText: '#80deea',
  chartGrid: 'rgba(0,255,255,0.08)',
  chartHumidity: '#00b0ff',
  chartWind: '#00e676',
  tooltipBg: '#0a0a0a',
  retryBg: 'rgba(0,100,100,0.9)',
};

export function WeatherWidget({ theme }: { theme: 'xp' | 'kali' }) {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<WeatherData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showTemp, setShowTemp] = useState(true);
  const [showHumidity, setShowHumidity] = useState(true);
  const [showWind, setShowWind] = useState(true);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = [
        `latitude=${LAT}`,
        `longitude=${LON}`,
        `current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure,visibility,cloud_cover,uv_index`,
        `hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`,
        `daily=weather_code,temperature_2m_max,temperature_2m_min`,
        `timezone=Australia%2FMelbourne`,
        `forecast_days=6`,
        `wind_speed_unit=kmh`,
      ].join('&');
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json: WeatherData = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch weather');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    const t = setInterval(fetchWeather, REFRESH_MS);
    return () => clearInterval(t);
  }, [fetchWeather]);

  if (isMobile) return null;

  const p = theme === 'xp' ? XP : KALI;
  const font = "'Tahoma','Segoe UI',sans-serif";
  const taskbarH = theme === 'xp' ? 40 : 44;

  // Find current hour slot in hourly data
  let startIdx = 0;
  if (data) {
    const now = new Date();
    const idx = data.hourly.time.findIndex((t) => new Date(t + ':00') >= now);
    startIdx = idx >= 0 ? idx : 0;
  }

  // 8 slots × every 3rd hour = 24 hrs
  const hourlySlots = data
    ? Array.from({ length: 8 }, (_, i) => startIdx + i * 3).filter(
        (i) => i < data.hourly.time.length
      )
    : [];

  // 24 consecutive hourly points for chart
  const chartData = data
    ? Array.from({ length: 24 }, (_, i) => startIdx + i)
        .filter((i) => i < data.hourly.time.length)
        .map((i) => ({
          time: fmtHour(data.hourly.time[i]),
          temp: Math.round(data.hourly.temperature_2m[i]),
          humidity: Math.round(data.hourly.relative_humidity_2m[i]),
          wind: Math.round(data.hourly.wind_speed_10m[i]),
        }))
    : [];

  // 5-day forecast (skip today at index 0)
  const forecastDays = data ? data.daily.time.slice(1, 6) : [];
  const cur = data?.current;
  const curInfo = cur ? wmoInfo(cur.weather_code) : null;

  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        top: 16,
        bottom: taskbarH + 8,
        width: 340,
        zIndex: 15,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 8,
        overflow: 'hidden',
        background: p.bg,
        border: p.border,
        boxShadow: theme === 'xp'
          ? '0 4px 20px rgba(0,0,0,0.35)'
          : '0 0 24px rgba(0,255,255,0.18),0 4px 20px rgba(0,0,0,0.6)',
        fontFamily: font,
        fontSize: 12,
        color: p.body,
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          background: p.headerBg,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          borderBottom: theme === 'xp'
            ? '1px solid #1247BA'
            : '1px solid rgba(0,255,255,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🇦🇺</span>
          <div>
            <div style={{ color: p.headerText, fontWeight: 'bold', fontSize: 14 }}>
              Melbourne
            </div>
            <div style={{ color: p.headerSub, fontSize: 11 }}>
              Victoria, Australia
            </div>
          </div>
        </div>
        {lastUpdated && (
          <div style={{ color: p.headerUpdated, fontSize: 10, textAlign: 'right' }}>
            Updated<br />{fmtTime(lastUpdated)}
          </div>
        )}
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>

        {/* Loading */}
        {loading && (
          <div style={{ padding: 32, textAlign: 'center', color: p.muted }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🌐</div>
            <div>Fetching Melbourne weather…</div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ padding: 24, textAlign: 'center', color: p.muted }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
            <div style={{ marginBottom: 12 }}>{error}</div>
            <button
              onClick={fetchWeather}
              style={{
                background: p.retryBg,
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                padding: '6px 16px',
                cursor: 'pointer',
                fontFamily: font,
                fontSize: 12,
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Main content */}
        {!loading && !error && data && cur && curInfo && (
          <>
            {/* ── Current conditions ── */}
            <div style={{ padding: '12px 14px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 44, fontWeight: 'bold', lineHeight: 1 }}>
                      {Math.round(cur.temperature_2m)}°
                    </span>
                    <span style={{ fontSize: 36 }}>{curInfo.emoji}</span>
                  </div>
                  <div style={{ color: p.muted, fontSize: 12, marginTop: 2 }}>{curInfo.desc}</div>
                  <div style={{ color: p.muted, fontSize: 11, marginTop: 1 }}>
                    {new Date().toLocaleDateString('en-AU', {
                      weekday: 'long', day: 'numeric', month: 'long',
                    })}
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '4px 10px',
                    background: p.statBg,
                    borderRadius: 6,
                    padding: '8px 10px',
                    border: p.sectionBorder,
                    flexShrink: 0,
                  }}
                >
                  {[
                    ['Feels like', `${Math.round(cur.apparent_temperature)}°C`],
                    ['Humidity', `${cur.relative_humidity_2m}%`],
                    ['Wind', `${Math.round(cur.wind_speed_10m)} km/h`],
                    ['Pressure', `${Math.round(cur.surface_pressure)} hPa`],
                    ['Visibility', `${(cur.visibility / 1000).toFixed(1)} km`],
                    ['UV / Cloud', `${Math.round(cur.uv_index)} / ${cur.cloud_cover}%`],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div style={{ color: p.muted, fontSize: 10 }}>{label}</div>
                      <div style={{ fontWeight: 'bold', fontSize: 11 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: p.divider, margin: '0 14px' }} />

            {/* ── Hourly strip ── */}
            <div style={{ padding: '10px 14px 8px' }}>
              <div style={{ fontSize: 10, fontWeight: 'bold', color: p.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>
                Next 24 Hours <span style={{ fontWeight: 'normal', textTransform: 'none' }}>(3-hourly)</span>
              </div>
              <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 4 }}>
                {hourlySlots.map((i) => {
                  const info = wmoInfo(data.hourly.weather_code[i]);
                  return (
                    <div
                      key={i}
                      style={{
                        flexShrink: 0,
                        background: p.hourlyBg,
                        border: p.sectionBorder,
                        borderRadius: 6,
                        padding: '6px 7px',
                        textAlign: 'center',
                        minWidth: 52,
                      }}
                    >
                      <div style={{ color: p.muted, fontSize: 10 }}>{fmtHour(data.hourly.time[i])}</div>
                      <div style={{ fontSize: 18, margin: '3px 0' }}>{info.emoji}</div>
                      <div style={{ fontWeight: 'bold', fontSize: 12 }}>
                        {Math.round(data.hourly.temperature_2m[i])}°
                      </div>
                      <div style={{ color: p.muted, fontSize: 10 }}>
                        {Math.round(data.hourly.wind_speed_10m[i])} km
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ height: 1, background: p.divider, margin: '0 14px' }} />

            {/* ── 24-hour chart ── */}
            <div style={{ padding: '10px 14px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 'bold', color: p.muted, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                  24-Hour Trends
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {([
                    { label: '🌡 Temp', active: showTemp, toggle: () => setShowTemp((v) => !v) },
                    { label: '💧 Hum', active: showHumidity, toggle: () => setShowHumidity((v) => !v) },
                    { label: '💨 Wind', active: showWind, toggle: () => setShowWind((v) => !v) },
                  ] as const).map(({ label, active, toggle }) => (
                    <button
                      key={label}
                      onClick={toggle}
                      style={{
                        background: active ? p.toggleActive : p.toggleInactive,
                        color: active ? p.toggleActiveText : p.toggleInactiveText,
                        border: 'none',
                        borderRadius: 4,
                        padding: '2px 6px',
                        fontSize: 10,
                        cursor: 'pointer',
                        fontFamily: font,
                        opacity: active ? 1 : 0.55,
                        transition: 'all 0.15s',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={p.chartGrid} />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 9, fill: p.muted, fontFamily: font }}
                    interval={5}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: p.muted, fontFamily: font }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: p.tooltipBg,
                      border: p.border,
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: font,
                      color: p.body,
                    }}
                    labelStyle={{ color: p.muted }}
                    itemStyle={{ color: p.body }}
                  />
                  {showTemp && (
                    <Line type="monotone" dataKey="temp" name="Temp °C" stroke="#ff7043" strokeWidth={1.5} dot={false} />
                  )}
                  {showHumidity && (
                    <Line type="monotone" dataKey="humidity" name="Humidity %" stroke={p.chartHumidity} strokeWidth={1.5} dot={false} />
                  )}
                  {showWind && (
                    <Line type="monotone" dataKey="wind" name="Wind km/h" stroke={p.chartWind} strokeWidth={1.5} dot={false} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{ height: 1, background: p.divider, margin: '0 14px' }} />

            {/* ── 5-day forecast ── */}
            <div style={{ padding: '10px 14px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 'bold', color: p.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>
                5-Day Forecast
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {forecastDays.map((dayStr, i) => {
                  const di = i + 1;
                  const info = wmoInfo(data.daily.weather_code[di]);
                  const max = Math.round(data.daily.temperature_2m_max[di]);
                  const min = Math.round(data.daily.temperature_2m_min[di]);
                  return (
                    <div
                      key={dayStr}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: p.sectionBg,
                        border: p.sectionBorder,
                        borderRadius: 5,
                        padding: '5px 10px',
                        gap: 6,
                      }}
                    >
                      <span style={{ width: 96, fontSize: 11 }}>{fmtDay(dayStr)}</span>
                      <span style={{ fontSize: 17 }}>{info.emoji}</span>
                      <span style={{ fontSize: 10, color: p.muted, flex: 1, textAlign: 'center' }}>{info.desc}</span>
                      <span style={{ fontWeight: 'bold', fontSize: 12, color: '#ff7043' }}>{max}°</span>
                      <span style={{ color: p.muted, fontSize: 11, marginLeft: 4 }}>{min}°</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
