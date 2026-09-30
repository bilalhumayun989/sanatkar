import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getCurrentProfile } from '@/lib/auth/supabase/server';

export async function POST(request: NextRequest) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || !profile) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (profile.role === 'seller' || profile.role === 'admin') {
    return NextResponse.json({ message: 'This account already has seller access.' }, { status: 409 });
  }

  const body = await request.json();
  const shopName = String(body.shopName || '').trim();
  const shopDescription = String(body.shopDescription || '').trim();
  const shopAddress = String(body.shopAddress || '').trim();
  const city = String(body.city || '').trim();
  const shopImageUrl = String(body.shopImageUrl || '').trim();
  const cnic = String(body.cnic || '').trim();
  const phone = String(body.phone || '').trim();

  if (!shopName || !shopDescription || !shopAddress || !city || !shopImageUrl || !cnic || !phone) {
    return NextResponse.json({ message: 'Please complete all required fields.' }, { status: 400 });
  }

  if (profile.seller_status === 'pending') {
    return NextResponse.json({ message: 'Your seller application is already under review.' }, { status: 409 });
  }

  const admin = createAdminClient();
  const profileUpdate = {
    shop_name: shopName,
    shop_description: shopDescription,
    shop_address: shopAddress,
    city,
    shop_image_url: shopImageUrl,
    cnic,
    phone,
    seller_status: 'pending',
  };

  let { error } = await admin
    .from('profiles')
    .update(profileUpdate)
    .eq('id', user.id)
    .eq('role', 'regular');

  // Keep existing deployments usable until the seller application migration is run.
  if (error?.message?.toLowerCase().includes('shop_address')) {
    const fallbackUpdate = { ...profileUpdate } as Record<string, string>;
    delete fallbackUpdate.shop_address;
    ({ error } = await admin
      .from('profiles')
      .update(fallbackUpdate)
      .eq('id', user.id)
      .eq('role', 'regular'));
  }

  if (error) {
    return NextResponse.json({ message: `Could not submit seller application: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true, status: 'pending' });
}
