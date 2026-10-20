import { NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const profiles = await prisma.profile.findMany({
      where: { role: 'seller', verificationStatus: 'approved' },
      select: { id: true, fullName: true, username: true, shopName: true, shopImageUrl: true },
      orderBy: [{ shopName: 'asc' }, { id: 'asc' }],
    });
    return NextResponse.json({ sellers: profiles.map(profile => ({
      id: profile.id,
      full_name: profile.fullName,
      username: profile.username,
      avatar_url: null,
      shop_name: profile.shopName,
      shop_image_url: profile.shopImageUrl,
    })) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Verified sellers query failed:', error);
    return NextResponse.json({ message: 'Unable to load verified sellers.' }, { status: 500 });
  }
}
