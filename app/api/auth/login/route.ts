import { createServerClient } from '@/lib/auth/supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  if (!email || !password) return NextResponse.json({ success: false, message: 'Email and password are required.' }, { status: 400 });

  const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} },
  });

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) return NextResponse.json({ success: false, message: 'Invalid email or password.' }, { status: 401 });

  const response = NextResponse.json({ success: true, message: 'Logged in successfully.', session: data.session });
  
  let sessionData = JSON.stringify(data.session);
  try {
      const parsed = JSON.parse(sessionData);
      delete parsed.user;
      sessionData = JSON.stringify(parsed);
  } catch (e) {}

  response.cookies.set('sb-sanatkar-auth', sessionData, { httpOnly: true, sameSite: 'lax', path: '/', secure: process.env.NODE_ENV === 'production', maxAge: 604800 });

  return response;
}
