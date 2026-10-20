import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';

export async function POST(request: NextRequest) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || !profile) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (profile.role === 'seller' || profile.role === 'admin') return NextResponse.json({ message: 'This account already has seller access.' }, { status: 409 });

  const body: unknown = await request.json();
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ message: 'Invalid seller application.' }, { status: 400 });
  const input = body as Record<string, unknown>;
  const fields = {
    shopName: input.shopName,
    shopDescription: input.shopDescription,
    shopAddress: input.shopAddress,
    city: input.city,
    shopImageUrl: input.shopImageUrl,
    cnic: input.cnic,
    phone: input.phone,
  };
  if (Object.values(fields).some(value => typeof value !== 'string' || !value.trim())) {
    return NextResponse.json({ message: 'Please complete all required fields.' }, { status: 400 });
  }
  const shopImageUrl = String(fields.shopImageUrl).trim();
  if (!shopImageUrl.startsWith('/') && !/^https:\/\//i.test(shopImageUrl)) {
    return NextResponse.json({ message: 'Shop image must be a local path or HTTPS URL.' }, { status: 400 });
  }
  if (profile.sellerStatus === 'pending') return NextResponse.json({ message: 'Your seller application is already under review.' }, { status: 409 });

  try {
    const result = await prisma.profile.updateMany({
      where: { id: user.id, role: 'regular', OR: [{ sellerStatus: null }, { sellerStatus: { not: 'pending' } }] },
      data: {
        shopName: String(fields.shopName).trim().slice(0, 120),
        shopDescription: String(fields.shopDescription).trim().slice(0, 1500),
        shopAddress: String(fields.shopAddress).trim().slice(0, 300),
        city: String(fields.city).trim().slice(0, 100),
        shopImageUrl: shopImageUrl.slice(0, 2048),
        cnic: String(fields.cnic).trim().slice(0, 40),
        phone: String(fields.phone).trim().slice(0, 40),
        sellerStatus: 'pending',
      },
    });
    if (!result.count) return NextResponse.json({ message: 'Your account is not eligible for a seller application.' }, { status: 409 });
    return NextResponse.json({ success: true, status: 'pending' });
  } catch (error) {
    console.error('Seller application save failed:', error);
    return NextResponse.json({ message: 'Could not submit seller application.' }, { status: 500 });
  }
}
