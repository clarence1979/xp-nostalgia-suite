import { supabase } from '@/integrations/supabase/client';

const LAST_LOG_KEY_PREFIX = 'last_login_log_';
const LOG_INTERVAL_MS = 24 * 60 * 60 * 1000;

async function fetchGeoData() {
  try {
    const geoRes = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
    if (geoRes.ok) {
      const geo = await geoRes.json();
      return {
        ip_address: geo.ip || 'unknown',
        city: geo.city || '',
        region: geo.region || '',
        country: geo.country_name || '',
        country_code: geo.country_code || '',
        latitude: typeof geo.latitude === 'number' ? geo.latitude : null,
        longitude: typeof geo.longitude === 'number' ? geo.longitude : null,
      };
    }
  } catch {
  }
  return { ip_address: 'unknown', city: '', region: '', country: '', country_code: '', latitude: null, longitude: null };
}

export async function logLogin(username: string): Promise<void> {
  try {
    const geo = await fetchGeoData();
    await supabase.from('login_logs').insert({
      username,
      ip_address: geo.ip_address,
      city: geo.city,
      region: geo.region,
      country: geo.country,
      country_code: geo.country_code,
      latitude: geo.latitude,
      longitude: geo.longitude,
    });
    await supabase.rpc('record_user_login', {
      p_username: username,
      p_ip: geo.ip_address,
      p_city: geo.city,
      p_country: geo.country,
    });
  } catch {
  }
}

export function logLoginIfDue(username: string): void {
  const key = LAST_LOG_KEY_PREFIX + username;
  const lastLog = localStorage.getItem(key);
  const now = Date.now();

  if (!lastLog || now - parseInt(lastLog, 10) > LOG_INTERVAL_MS) {
    localStorage.setItem(key, String(now));
    logLogin(username);
  }
}
