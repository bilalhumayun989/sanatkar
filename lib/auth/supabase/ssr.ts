import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AUTH_COOKIE_NAME, authCookieOptions, authCookieValue, readAuthAccessToken } from './auth-cookie';

type Cookie = { name: string; value: string; options?: Record<string, unknown> };
type CookieAdapter = { getAll: () => { name: string; value: string }[]; setAll: (cookies: Cookie[]) => void };
export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// Server requests validate the access token without rotating the browser's session.
export function createServerClient(url: string, key: string, options: { cookies: CookieAdapter }): SupabaseClient {
  if (!url || !key) throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  const token = readAuthAccessToken(options.cookies.getAll().find(cookie => cookie.name === AUTH_COOKIE_NAME)?.value);
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: token ? { Authorization: 'Bearer ' + token } : {} },
  });
  client.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      options.cookies.setAll([{ name: AUTH_COOKIE_NAME, value: authCookieValue(session), options: authCookieOptions() }]);
    } else if (event === 'SIGNED_OUT') {
      options.cookies.setAll([{ name: AUTH_COOKIE_NAME, value: '', options: { ...authCookieOptions(), maxAge: 0 } }]);
    }
  });
  return client;
}

export function createBrowserClient(url: string, key: string) {
  if (!url || !key) throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');

  const storage = typeof window !== 'undefined' ? window.localStorage : undefined;

  return createClient(url, key, {
    auth: {
      storage,
      detectSessionInUrl: false,
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}
