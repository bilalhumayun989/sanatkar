import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type Cookie = { name: string; value: string; options?: Record<string, unknown> };
type CookieAdapter = { getAll: () => { name: string; value: string }[]; setAll: (cookies: Cookie[]) => void };
const SESSION_COOKIE = 'sb-sanatkar-auth';

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// A minimal server cookie adapter for Supabase JS. Tokens are still validated with
// auth.getUser() on every server request; this only persists the session transport.
export function createServerClient(url: string, key: string, options: { cookies: CookieAdapter }): SupabaseClient {
  if (!url || !key) throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  const initial = options.cookies.getAll().find((cookie) => cookie.name === SESSION_COOKIE)?.value;
  const storage = {
    getItem: () => initial ?? null,
    setItem: (_name: string, value: string) => {
      let sessionData = value;
      try {
        const parsed = JSON.parse(value);
        if (parsed.user) {
          delete parsed.user;
          sessionData = JSON.stringify(parsed);
        }
      } catch (e) {}
      options.cookies.setAll([{ name: SESSION_COOKIE, value: sessionData, options: { httpOnly: true, sameSite: 'lax', path: '/', secure: process.env.NODE_ENV === 'production', maxAge: 604800 } }]);
    },
    removeItem: () => {
      options.cookies.setAll([{ name: SESSION_COOKIE, value: '', options: { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 } }]);
    },
  };
  return createClient(url, key, { auth: { storage, persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } });
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
