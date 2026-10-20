import { NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { listingSellerSelect, serializeListing } from '@/lib/listings';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ success: false, message: 'Shop not found.' }, { status: 404 });
  try {
    const profile = await prisma.profile.findFirst({
      where: { id, role: 'seller', sellerStatus: 'approved' },
      select: { id: true, username: true, fullName: true, shopName: true, shopDescription: true, shopAddress: true, shopImageUrl: true, city: true, verificationStatus: true },
    });
    if (!profile) return NextResponse.json({ success: false, message: 'Shop not found.' }, { status: 404 });
    const listings = await prisma.listing.findMany({
      where: { sellerId: id, status: 'active' },
      include: { seller: { select: listingSellerSelect } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, shop: {
      id: profile.id,
      title: profile.shopName || profile.fullName || profile.username,
      shop_name: profile.shopName,
      description: profile.shopDescription,
      address: profile.shopAddress,
      city: profile.city,
      image_url: profile.shopImageUrl,
      verification_status: profile.verificationStatus,
      username: profile.username,
    }, listings: listings.map(serializeListing) });
  } catch (error) {
    console.error('Shop profile query failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to load this shop.' }, { status: 500 });
  }
}
