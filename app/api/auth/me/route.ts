import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || !profile) return NextResponse.json({ success: true, user: null });

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: profile.fullName || profile.username,
      username: profile.username,
      role: profile.role,
      seller_status: profile.seller_status ?? null,
      verification_status: profile.verification_status ?? null,
      total_listings_posted: profile.total_listings_posted ?? 0,
      onboarding_complete: profile.onboarding_complete ?? false,
    },
  });
}
