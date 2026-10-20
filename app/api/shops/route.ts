import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const pageSize = Math.min(Math.max(Number(request.nextUrl.searchParams.get('limit')) || 60, 1), 100);
  try {
    const profiles = await prisma.profile.findMany({
      where: { role: 'seller', sellerStatus: 'approved' },
      select: { id: true, username: true, fullName: true, shopName: true, shopDescription: true, shopImageUrl: true, city: true, verificationStatus: true },
      orderBy: [{ shopName: 'asc' }, { id: 'asc' }],
      take: pageSize,
    });
    const sellerIds = profiles.map(profile => profile.id);
    const counts = sellerIds.length
      ? await prisma.listing.groupBy({
        by: ['sellerId'],
        where: { sellerId: { in: sellerIds }, status: 'active' },
        _count: { _all: true },
      })
      : [];
    const countBySeller = new Map(counts.map(count => [count.sellerId, count._count._all]));
    const shops = profiles.map(profile => ({
      id: profile.id,
      seller_id: profile.id,
      title: profile.shopName || profile.fullName || profile.username,
      description: profile.shopDescription,
      image_urls: profile.shopImageUrl ? [profile.shopImageUrl] : [],
      city: profile.city,
      verification_status: profile.verificationStatus,
      listing_count: countBySeller.get(profile.id) ?? 0,
    }));
    return NextResponse.json({ success: true, shops });
  } catch (error) {
    console.error('Shop directory query failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to load shops.', shops: [] }, { status: 500 });
  }
}
