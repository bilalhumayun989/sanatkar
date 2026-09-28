import { NextRequest, NextResponse } from 'next/server';
import { createRouteSupabaseClient } from '@/lib/auth/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = NextResponse.json({ success: true, message: 'Session synced successfully' });
    
    // Check if email verification status needs updating
    if (body.emailVerified && body.access_token) {
      try {
        const { client } = createRouteSupabaseClient(request);
        const { data: { user } } = await client.auth.getUser(body.access_token);
        
        if (user && user.email_confirmed_at) {
          // Update email_verified status in profiles table
          await client
            .from('profiles')
            .update({ email_verified: true })
            .eq('id', user.id)
            .eq('email_verified', false); // Only update if not already verified
        }
      } catch (e) {
        // Non-fatal error, continue with session sync
        console.error('Error updating email verification status:', e);
      }
    }
    
    let sessionData = JSON.stringify(body);
    try {
        const parsed = JSON.parse(sessionData);
        if (parsed.user) delete parsed.user;
        if (parsed.emailVerified) delete parsed.emailVerified; // Remove custom field
        sessionData = JSON.stringify(parsed);
    } catch (e) {}
    
    response.cookies.set('sb-sanatkar-auth', sessionData, { httpOnly: true, sameSite: 'lax', path: '/', secure: process.env.NODE_ENV === 'production', maxAge: 604800 });

    return response;
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: err?.message || 'Failed to sync session' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
}
