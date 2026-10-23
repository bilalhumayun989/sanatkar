import { createServerClient, isSupabaseConfigured } from './ssr';
import { createClient as createSupabaseClient, type User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/dbConn';

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
    if (user && await isDeletedAccount(user.id)) return { user: null, error: null };
    return { user, error };
  }

  const { client } = createRouteSupabaseClient(request);
  const { data: { user }, error } = await client.auth.getUser();
  if (user && await isDeletedAccount(user.id)) return { user: null, error: null };
  return { user, error };
}

async function isDeletedAccount(userId: string) {
  const rows = await prisma.$queryRaw<Array<{ user_id: string }>>`
    SELECT user_id FROM public.deleted_accounts WHERE user_id = ${userId}::uuid`;
  return rows.length > 0;
}

export async function syncSupabaseProfile(user: User) {
  const email = user.email ?? `${user.id}@unknown.invalid`;
  const username = `${(user.email?.split('@')[0] || 'user').slice(0, 40)}-${user.id.slice(0, 8)}`;
  const authName = user.user_metadata?.full_name;
  const wantsSeller = user.user_metadata?.account_type === 'seller';
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${user.id}, 0))::text`;
    const deleted = await tx.$queryRaw<Array<{ user_id: string }>>`SELECT user_id FROM public.deleted_accounts WHERE user_id = ${user.id}::uuid`;
    if (deleted.length) throw new Error('Account has been deleted');
    return tx.profile.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        username,
        email,
        role: wantsSeller ? 'seller' : 'regular',
        sellerStatus: wantsSeller ? 'shop_required' : null,
        emailVerified: Boolean(user.email_confirmed_at),
        ...(typeof authName === 'string' && authName.trim() ? { fullName: authName.trim().slice(0, 120) } : {}),
      },
      update: { email, emailVerified: Boolean(user.email_confirmed_at) },
    });
  });
}

export async function getCurrentProfile(request: NextRequest) {
  const { user, error } = await getCurrentUser(request);
  if (!user || error) return { user: null, profile: null };
  const profile = await syncSupabaseProfile(user);

  return {
    user,
    profile: {
      ...profile,
      seller_status: profile.sellerStatus,
      verification_status: profile.verificationStatus,
      total_listings_posted: profile.totalListingsPosted,
      onboarding_complete: profile.onboardingComplete,
      seller_activation_status: profile.sellerActivationStatus,
    },
  };
}
