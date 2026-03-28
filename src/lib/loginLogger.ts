import { supabase } from '@/integrations/supabase/client';

const LAST_LOGIN_LOG_KEY = 'last_login_logged';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const shouldLogSessionRefresh = (username: string): boolean => {
  try {
    const stored = localStorage.getItem(`${LAST_LOGIN_LOG_KEY}_${username}`);
    if (!stored) return true;
    return (Date.now() - parseInt(stored, 10)) >= ONE_DAY_MS;
  } catch {
    return true;
  }
};

const markLoginLogged = (username: string): void => {
  try {
    localStorage.setItem(`${LAST_LOGIN_LOG_KEY}_${username}`, Date.now().toString());
  } catch {
  }
};

export const logLoginEvent = async (username: string): Promise<void> => {
  try {
    let ip_address = 'unknown';
    let city = '';
    let region = '';
    let country = '';
    let country_code = '';
    let latitude: number | null = null;
    let longitude: number | null = null;

    try {
      const geoRes = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
      if (geoRes.ok) {
        const geo = await geoRes.json();
        ip_address = geo.ip || 'unknown';
        city = geo.city || '';
        region = geo.region || '';
        country = geo.country_name || '';
        country_code = geo.country_code || '';
        latitude = typeof geo.latitude === 'number' ? geo.latitude : null;
        longitude = typeof geo.longitude === 'number' ? geo.longitude : null;
      }
    } catch {
    }

    await supabase.from('login_logs').insert({
      username,
      ip_address,
      city,
      region,
      country,
      country_code,
      latitude,
      longitude,
    });

    await supabase.rpc('record_user_login', {
      p_username: username,
      p_ip: ip_address,
      p_city: city,
      p_country: country,
    });

    markLoginLogged(username);
  } catch {
  }
};
