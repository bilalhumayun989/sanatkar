import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/supabase/server';
import prisma from '@/lib/dbConn';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || !profile) return NextResponse.json({ success: true, user: null });
  const totalListingsPosted = await prisma.listing.count({ where: { sellerId: user.id } });

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: profile.fullName || profile.username,
      username: profile.username,
      role: profile.role,
      seller_status: profile.seller_status ?? null,
      seller_activation_status: profile.sellerActivationStatus,
      shop_name: profile.shopName,
      shop_complete: Boolean(profile.shopName && profile.shopDescription && profile.shopAddress && profile.city && profile.shopImageUrl && profile.phone && profile.cnic),
      verification_status: profile.verification_status ?? null,
      total_listings_posted: totalListingsPosted,
      onboarding_complete: profile.onboarding_complete ?? false,
    },
  });
}
