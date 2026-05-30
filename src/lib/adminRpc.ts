const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export async function adminRpc<T = unknown>(
  fn: string,
  params: Record<string, unknown> = {},
): Promise<{ data: T | null; error: { message: string } | null }> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY,
      },
      body: JSON.stringify({ fn, params }),
    });

    const json = await res.json();

    if (!res.ok) {
      return { data: null, error: { message: json.error || `Request failed (${res.status})` } };
    }

    return { data: json as T, error: null };
  } catch (err: any) {
    return { data: null, error: { message: err.message || 'Network error' } };
  }
}
