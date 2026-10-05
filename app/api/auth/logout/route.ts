import { createClient } from '@/lib/auth/supabase/server';
import { AUTH_COOKIE_NAME, authCookieOptions, readAuthAccessToken } from '@/lib/auth/supabase/auth-cookie';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
  const token = readAuthAccessToken(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  if (token) await createClient().auth.admin.signOut(token, 'local');
  response.cookies.set(AUTH_COOKIE_NAME, '', { ...authCookieOptions(), maxAge: 0 });
  return response;
}
