import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';
import { listingSellerSelect, serializeListing } from '@/lib/listings';
import { PAID_BADGES_ENABLED } from '@/lib/features';

export async function GET(request: NextRequest) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || profile?.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Admin access required.' }, { status: 403 });
  }

  try {
    const [profiles, listings, categories, brands, sellerRequests, badgeRequests] = await Promise.all([
      prisma.profile.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.listing.findMany({
        include: { seller: { select: listingSellerSelect } },
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
      prisma.category.findMany({ orderBy: { name: 'asc' } }),
      prisma.brand.findMany({ orderBy: { name: 'asc' } }),
      prisma.profile.findMany({
        where: { role: { in: ['seller', 'professional'] }, sellerStatus: 'pending', sellerActivationStatus: 'pending', sellerPaymentProofPath: { not: null } },
        orderBy: { createdAt: 'asc' },
      }),
      PAID_BADGES_ENABLED ? prisma.profile.findMany({
        where: { role: 'seller', verificationStatus: 'pending' },
        orderBy: { verificationRequestedAt: 'asc' },
      }) : Promise.resolve([]),
    ]);

    const toProfile = (item: typeof profiles[number]) => ({
      id: item.id,
      username: item.username,
      full_name: item.fullName,
      email: item.email,
      phone: item.phone,
      cnic: item.cnic,
      role: item.role,
      seller_status: item.sellerStatus,
      seller_activation_status: item.sellerActivationStatus,
      seller_payment_proof_url: item.sellerPaymentProofPath ? `/api/profile/seller-activation/proof?userId=${item.id}` : null,
      seller_payment_submitted_at: item.sellerPaymentSubmittedAt?.toISOString() ?? null,
      verification_status: item.verificationStatus,
      verification_proof_url: item.verificationProofUrl,
      verification_requested_at: item.verificationRequestedAt?.toISOString() ?? null,
      created_at: item.createdAt.toISOString(),
      total_listings_posted: item.totalListingsPosted,
      shop_name: item.shopName,
      shop_description: item.shopDescription,
      shop_address: item.shopAddress,
      shop_image_url: item.shopImageUrl,
      city: item.city,
    });

    return NextResponse.json({
      success: true,
      profiles: profiles.map(toProfile),
      listings: listings.map(serializeListing),
      categories: categories.map(item => ({
        id: item.id,
        name: item.name,
        icon_code: item.iconCode,
        description: item.description,
        image_url: item.imageUrl,
        is_active: item.isActive,
        is_popular: item.isPopular,
      })),
      brands: brands.map(item => ({
        id: item.id,
        name: item.name,
        logo_url: item.logoUrl,
        description: item.description,
        is_active: item.isActive,
      })),
      seller_requests: sellerRequests.map(toProfile),
      badge_requests: badgeRequests.map(toProfile),
    });
  } catch (error) {
    console.error('Admin overview query failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to load admin data.' }, { status: 500 });
  }
}
