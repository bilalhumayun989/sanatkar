import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/supabase/server';


export async function GET(request: NextRequest) {
  const { user, profile } = await getCurrentProfile(request);
  // This endpoint is also called on public pages to hydrate the navbar. An
  // anonymous visitor is an expected state, not an API failure.
  if (!user || !profile) return NextResponse.json({ success: true, user: null });
  return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: profile.username, role: profile.role } });
}
