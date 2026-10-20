import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase/server';
import { syncSupabaseProfile } from '@/lib/auth/supabase/server';
import { AUTH_COOKIE_NAME, authCookieOptions, authCookieValue } from '@/lib/auth/supabase/auth-cookie';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (typeof body?.access_token !== 'string' || !body.access_token) {
      return NextResponse.json({ success: false, message: 'A valid access token is required.' }, { status: 400 });
    }
    const { data: { user }, error } = await createClient().auth.getUser(body.access_token);
    if (error || !user) {
      return NextResponse.json({ success: false, message: 'Session expired. Please sign in again.' }, { status: 401 });
    }
    await syncSupabaseProfile(user);
    const response = NextResponse.json({ success: true, message: 'Session synced successfully' });
    response.cookies.set(AUTH_COOKIE_NAME, authCookieValue(body), authCookieOptions());
    return response;
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to sync session' }, { status: 400 });
  }
}
