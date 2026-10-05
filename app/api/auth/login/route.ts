import { createClient } from '@/lib/auth/supabase/server';
import { AUTH_COOKIE_NAME, authCookieOptions, authCookieValue } from '@/lib/auth/supabase/auth-cookie';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  if (!email || !password) return NextResponse.json({ success: false, message: 'Email and password are required.' }, { status: 400 });

  // A new login must not initialize or refresh an old cookie session.
  const { data, error } = await createClient().auth.signInWithPassword({ email, password });
  if (error) return NextResponse.json({ success: false, message: 'Invalid email or password.' }, { status: 401 });

  const response = NextResponse.json({ success: true, message: 'Logged in successfully.', session: data.session });
  if (data.session) response.cookies.set(AUTH_COOKIE_NAME, authCookieValue(data.session), authCookieOptions());
  return response;
}
