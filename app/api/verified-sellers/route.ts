import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Return only public storefront fields; profiles themselves remain private.
    const client = createAdminClient();
    const sellers = [];
    // Badge approval is independent of the seller-account approval workflow.
    // Page through results so every badge holder is included, beyond the API row limit.
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await client.from('profiles')
        .select('id, full_name, username, avatar_url, shop_name, shop_image_url')
        .eq('role', 'seller').eq('verification_status', 'approved')
        .order('shop_name').order('id').range(offset, offset + 499);
      if (error) throw error;
      sellers.push(...(data || []));
      if (!data || data.length < 500) break;
    }
    return NextResponse.json({ sellers }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ message: 'Unable to load verified sellers.' }, { status: 500 });
  }
}
