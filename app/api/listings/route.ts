import { NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { createAdminClient } from '@/lib/supabase/server';

function mapListingItem(item: any) {
  const imageUrls = Array.isArray(item.image_urls)
    ? item.image_urls
    : item.image_urls
      ? [item.image_urls]
      : Array.isArray(item.images)
        ? item.images
        : [];

  return {
    id: item.id,
    title: item.title || item.model || item.make || 'Listing',
    brand: item.brand || item.make || item.title || 'Unknown',
    category: item.category || 'General',
    price: Number(item.price) || 0,
    location: item.location || item.city || 'Pakistan',
    description: item.description || '',
    image_urls: imageUrls,
    make: item.make || item.brand || '',
    model: item.model || item.title || '',
    city: item.city || item.location || '',
    mileage: item.mileage || item.hours || 0,
    condition: item.condition || item.fuelType || 'New',
    created_at: item.created_at || item.createdAt || null,
    status: item.status || 'active',
  };
}

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(12);

    if (!error && Array.isArray(data) && data.length > 0) {
      return NextResponse.json({ success: true, data: data.map(mapListingItem) });
    }

    if (!error) {
      return NextResponse.json({ success: true, data: [] });
    }

    console.warn('Supabase listings query failed, falling back to Prisma:', error?.message || 'unknown error');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn('Supabase listings route error, falling back to Prisma:', message);
  }

  try {
    const cars = await prisma.car.findMany({
      where: { status: 'available' },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });

    return NextResponse.json({ success: true, data: cars.map(mapListingItem) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Listings route error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
