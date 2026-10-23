import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';
import { hasCompleteShop } from '@/lib/seller-activation';

export async function POST(request: NextRequest) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || !profile) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (profile.role === 'admin' || (profile.sellerActivationStatus === 'approved' && hasCompleteShop(profile)) || profile.sellerActivationStatus === 'pending') return NextResponse.json({ message: 'Your seller account is already active or awaiting payment review.' }, { status: 409 });

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

  try {
    const result = await prisma.profile.updateMany({
      where: { id: user.id, role: { in: ['regular', 'seller', 'professional'] }, sellerActivationStatus: { in: ['unpaid', 'rejected', 'approved'] } },
      data: {
        shopName: String(fields.shopName).trim().slice(0, 120),
        shopDescription: String(fields.shopDescription).trim().slice(0, 1500),
        shopAddress: String(fields.shopAddress).trim().slice(0, 300),
        city: String(fields.city).trim().slice(0, 100),
        shopImageUrl: shopImageUrl.slice(0, 2048),
        cnic: String(fields.cnic).trim().slice(0, 40),
        phone: String(fields.phone).trim().slice(0, 40),
        role: 'seller',
        sellerStatus: profile.sellerActivationStatus === 'approved' ? 'approved' : 'payment_required',
        sellerActivationStatus: profile.sellerActivationStatus === 'approved' ? 'approved' : 'unpaid',
        onboardingComplete: true,
      },
    });
    if (!result.count) return NextResponse.json({ message: 'Your account is not eligible for a seller application.' }, { status: 409 });
    return NextResponse.json({ success: true, status: 'payment_required', next: '/seller-activation' });
  } catch (error) {
    console.error('Seller application save failed:', error);
    return NextResponse.json({ message: 'Could not submit seller application.' }, { status: 500 });
  }
}
