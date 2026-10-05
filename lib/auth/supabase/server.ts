import { createServerClient, isSupabaseConfigured } from './ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase environment variables are not configured');
  return { url, key };
}

export function supabaseSetupError() {
  return !isSupabaseConfigured() ? 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.' : null;
}

/** Use in API routes and server components */
export function createClient() {
  const { url, key } = config();
  return createSupabaseClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
}

/** Use in server components/server actions. */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const { url, key } = config();
  return createServerClient(url, key, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
  });
}

/** Use in a route handler to read the access-token cookie and collect auth cookie changes. */
export function createRouteSupabaseClient(request: NextRequest) {
  const { url, key } = config();
  const response = NextResponse.next();
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });
  return { client, response };
}

/** Server only. Never import this from a client component. */
export function createAdminClient() {
  const { url } = config();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  return createSupabaseClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function getCurrentUser(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  const accessToken = authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : null;
  if (accessToken) {
    const { url, key } = config();
    const client = createSupabaseClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user }, error } = await client.auth.getUser(accessToken);
    return { user, error };
  }

  const { client } = createRouteSupabaseClient(request);
  const { data: { user }, error } = await client.auth.getUser();
  return { user, error };
}

export async function getCurrentProfile(request: NextRequest) {
  const { user, error } = await getCurrentUser(request);
  if (!user || error) return { user: null, profile: null };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, username, role, seller_status, verification_status, total_listings_posted, onboarding_complete')
    .eq('id', user.id)
    .maybeSingle();

  if (profile) {
    return { user, profile };
  }

  const username = user.email ? user.email.split('@')[0] : 'user';
  const { data: newProfile } = await admin
    .from('profiles')
    .insert({
      id: user.id,
      username,
      email: user.email ?? 'unknown@example.com',
      role: 'regular',
      onboarding_complete: false,
    })
    .select('id, username, role, seller_status, verification_status, total_listings_posted, onboarding_complete')
    .single();

  return {
    user,
    profile: newProfile ?? { id: user.id, username, role: 'regular', seller_status: null, verification_status: null, total_listings_posted: 0, onboarding_complete: false },
  };
}
