import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';

export async function GET(request: NextRequest) {
  const { user } = await getCurrentProfile(request);
  if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      include: { listing: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      favorites: favorites.map((favorite) => ({
        id: favorite.id,
        listing_id: favorite.listingId,
        user_id: favorite.userId,
        created_at: favorite.createdAt.toISOString(),
        listing: favorite.listing ? {
          id: favorite.listing.id,
          title: favorite.listing.title,
          brand: favorite.listing.brand,
          category: favorite.listing.category,
          price: Number(favorite.listing.price),
          location: favorite.listing.location,
          image_urls: favorite.listing.imageUrls ?? [],
          condition: favorite.listing.condition,
          status: favorite.listing.status,
        } : null,
      })),
    });
  } catch (error) {
    console.error('Favorites lookup failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to load favorites.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user } = await getCurrentProfile(request);
  if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ success: false, message: 'Invalid favorite payload.' }, { status: 400 });
  }

  const listingId = (body as Record<string, unknown>).listing_id ?? (body as Record<string, unknown>).listingId;
  if (typeof listingId !== 'string' || !/^[0-9a-f-]{36}$/i.test(listingId)) {
    return NextResponse.json({ success: false, message: 'A valid listing id is required.' }, { status: 400 });
  }

  try {
    const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { id: true } });
    if (!listing) return NextResponse.json({ success: false, message: 'Listing not found.' }, { status: 404 });

    const favorite = await prisma.favorite.upsert({
      where: { userId_listingId: { userId: user.id, listingId } },
      update: {},
      create: { userId: user.id, listingId },
    });

    return NextResponse.json({ success: true, favorite: { id: favorite.id, listing_id: favorite.listingId, user_id: favorite.userId } }, { status: 201 });
  } catch (error) {
    console.error('Favorite save failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to save favorite.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { user } = await getCurrentProfile(request);
  if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  const listingId = body && typeof body === 'object' && !Array.isArray(body)
    ? (body as Record<string, unknown>).listing_id ?? (body as Record<string, unknown>).listingId ?? (body as Record<string, unknown>).id ?? null
    : null;

  if (typeof listingId !== 'string' || !/^[0-9a-f-]{36}$/i.test(listingId)) {
    return NextResponse.json({ success: false, message: 'A valid listing id is required.' }, { status: 400 });
  }

  try {
    await prisma.favorite.deleteMany({ where: { userId: user.id, listingId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Favorite delete failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to remove favorite.' }, { status: 500 });
  }
}
