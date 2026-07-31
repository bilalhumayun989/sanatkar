import { NextRequest, NextResponse } from 'next/server';
import { createRouteSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = NextResponse.json({ success: true, message: 'Session synced successfully' });
    
    let sessionData = JSON.stringify(body);
    try {
        const parsed = JSON.parse(sessionData);
        if (parsed.user) delete parsed.user;
        sessionData = JSON.stringify(parsed);
    } catch (e) {}
    
    response.cookies.set('sb-sanatkar-auth', sessionData, { httpOnly: true, sameSite: 'lax', path: '/', secure: process.env.NODE_ENV === 'production', maxAge: 604800 });

    return response;
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: err?.message || 'Failed to sync session' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
}
