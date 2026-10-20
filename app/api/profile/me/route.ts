import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';

export async function GET(request: NextRequest) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || !profile) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const [totalListings, activeListings, offersCount, listingIds] = await Promise.all([
      prisma.listing.count({ where: { sellerId: user.id } }),
      prisma.listing.count({ where: { sellerId: user.id, status: 'active' } }),
      prisma.offer.count({ where: { sellerId: user.id, status: 'pending' } }),
      prisma.listing.findMany({ where: { sellerId: user.id }, select: { id: true } }),
    ]);
    const viewsCount = listingIds.length
      ? await prisma.listingView.count({ where: { listingId: { in: listingIds.map(listing => listing.id) } } })
      : 0;
    return NextResponse.json({ success: true, profile: {
      id: profile.id,
      username: profile.username,
      full_name: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      cnic: profile.cnic,
      role: profile.role,
      email_verified: profile.emailVerified,
      seller_status: profile.sellerStatus,
      verification_status: profile.verificationStatus,
      verification_proof_url: profile.verificationProofUrl,
      verification_requested_at: profile.verificationRequestedAt,
      shop_name: profile.shopName,
      shop_description: profile.shopDescription,
      shop_address: profile.shopAddress,
      shop_image_url: profile.shopImageUrl,
      city: profile.city,
      onboarding_complete: profile.onboardingComplete,
      total_listings_posted: totalListings,
      active_listings: activeListings,
      offers_count: offersCount,
      views_count: viewsCount,
      created_at: profile.createdAt,
    } });
  } catch (error) {
    console.error('Profile query failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to load profile.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { user, profile: currentProfile } = await getCurrentProfile(request);
  if (!user || !currentProfile) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, message: 'Invalid profile data.' }, { status: 400 });
  const input = body as Record<string, unknown>;
  const data: {
    username?: string;
    fullName?: string | null;
    phone?: string | null;
    cnic?: string | null;
    onboardingComplete?: boolean;
    shopName?: string | null;
    shopDescription?: string | null;
    shopImageUrl?: string | null;
  } = {};
  if (typeof input.username === 'string') {
    const username = input.username.trim();
    if (username.length < 3 || username.length > 50) return NextResponse.json({ success: false, message: 'Username must be 3–50 characters.' }, { status: 400 });
    data.username = username;
  }
  if (typeof input.full_name === 'string') data.fullName = input.full_name.trim().slice(0, 120) || null;
  if (typeof input.phone === 'string') data.phone = input.phone.trim().slice(0, 40) || null;
  if (typeof input.cnic === 'string' && currentProfile.role === 'seller') data.cnic = input.cnic.trim().slice(0, 40) || null;
  if (typeof input.onboarding_complete === 'boolean') data.onboardingComplete = input.onboarding_complete;
  const shopFields = ['shop_name', 'shop_description', 'shop_image_url'];
  if (shopFields.some(field => input[field] !== undefined) && currentProfile.role !== 'seller') {
    return NextResponse.json({ success: false, message: 'Seller access is required to update shop details.' }, { status: 403 });
  }
  if (typeof input.shop_name === 'string') data.shopName = input.shop_name.trim().slice(0, 120) || null;
  if (typeof input.shop_description === 'string') data.shopDescription = input.shop_description.trim().slice(0, 1500) || null;
  if (typeof input.shop_image_url === 'string' || input.shop_image_url === null) {
    const imageUrl = typeof input.shop_image_url === 'string' ? input.shop_image_url.trim() : '';
    if (imageUrl && imageUrl.length > 2048 || imageUrl && !imageUrl.startsWith('/') && !/^https:\/\//i.test(imageUrl)) {
      return NextResponse.json({ success: false, message: 'Shop image must be a local path or HTTPS URL.' }, { status: 400 });
    }
    data.shopImageUrl = imageUrl || null;
  }
  if (!Object.keys(data).length) return NextResponse.json({ success: false, message: 'No supported profile fields.' }, { status: 400 });
  try {
    const profile = await prisma.profile.update({ where: { id: user.id }, data });
    return NextResponse.json({ success: true, profile: {
      id: profile.id,
      username: profile.username,
      full_name: profile.fullName,
      phone: profile.phone,
      cnic: profile.cnic,
      shop_name: profile.shopName,
      shop_description: profile.shopDescription,
      shop_image_url: profile.shopImageUrl,
    } });
  } catch (error) {
    console.error('Profile update failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to update profile.' }, { status: 500 });
  }
}
