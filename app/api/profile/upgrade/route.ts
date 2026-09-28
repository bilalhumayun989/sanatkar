import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getCurrentProfile } from '@/lib/auth/supabase/server';
export async function POST(request: NextRequest) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || !profile) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (profile.role !== 'regular') return NextResponse.json({ success: true, role: profile.role });
  const { error } = await createAdminClient().from('profiles').update({ role: 'seller' }).eq('id', user.id).eq('role', 'regular');
  if (error) return NextResponse.json({ message: 'Could not upgrade account.' }, { status: 500 });
  return NextResponse.json({ success: true, role: 'seller' });
}
