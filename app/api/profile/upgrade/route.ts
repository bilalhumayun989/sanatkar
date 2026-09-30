import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/supabase/server';
export async function POST(request: NextRequest) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || !profile) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (profile.role === 'seller' || profile.role === 'admin') {
    return NextResponse.json({ success: true, role: profile.role });
  }
  return NextResponse.json({ message: 'Please submit a seller application for admin approval.' }, { status: 403 });
}
