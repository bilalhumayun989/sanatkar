import { NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { createAdminClient, getCurrentUser } from '@/lib/supabase/server';

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

export async function GET(request: Request) {
  try {
    let currentUserId: string | null = null;
    
    // Try to get current user, but don't fail if auth doesn't work
    try {
      const { user } = await getCurrentUser(request);
      currentUserId = user?.id || null;
    } catch (authError) {
      console.warn('Auth error in listings API:', authError);
      // Continue without user ID - will show all listings
    }

    // Check if this is a request to include own listings (for my-ads page)
    const url = new URL(request.url);
    const includeOwnListings = url.searchParams.get('includeOwn') === 'true';

    const supabase = createAdminClient();
    
    // Build query
    let query = supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')  // Only show active listings
      .order('created_at', { ascending: false })
      .limit(12);

    // If user is logged in and we shouldn't include their listings, exclude them
    // For now, allow users to see their own listings in the "Just Dropped" collections
    // if (currentUserId && !includeOwnListings) {
    //   query = query.neq('seller_id', currentUserId);
    // }

    const { data, error } = await query;

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
