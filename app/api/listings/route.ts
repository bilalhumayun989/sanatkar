import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/dbConn';
import { getCurrentProfile, getCurrentUser } from '@/lib/auth/supabase/server';
import { listingSellerSelect, parseImageUrls, serializeListing } from '@/lib/listings';

export const dynamic = 'force-dynamic';

function boundedInt(value: string | null, fallback: number, max: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const includeOwn = params.get('includeOwn') === 'true';
    let userId: string | null = null;
    if (includeOwn) {
      const { user } = await getCurrentUser(request);
      if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
      userId = user.id;
    }

    const where: Prisma.ListingWhereInput = {
      ...(includeOwn && userId
        ? { OR: [{ status: 'active' }, { sellerId: userId }] }
        : { status: 'active' }),
      ...(params.get('category') ? { category: { equals: params.get('category')!, mode: 'insensitive' } } : {}),
      ...(params.get('brand') ? { brand: { equals: params.get('brand')!, mode: 'insensitive' } } : {}),
      ...(params.get('sellerId') ? { sellerId: params.get('sellerId')! } : {}),
      ...(params.get('featured') === 'true' ? { isFeatured: true } : {}),
    };
    const minPriceValue = params.get('minPrice');
    const maxPriceValue = params.get('maxPrice');
    const minPrice = minPriceValue?.trim() ? Number(minPriceValue) : null;
    const maxPrice = maxPriceValue?.trim() ? Number(maxPriceValue) : null;
    if ((minPrice !== null && Number.isFinite(minPrice)) || (maxPrice !== null && Number.isFinite(maxPrice))) {
      where.price = {
        ...(minPrice !== null && Number.isFinite(minPrice) ? { gte: minPrice } : {}),
        ...(maxPrice !== null && Number.isFinite(maxPrice) ? { lte: maxPrice } : {}),
      };
    }
    const search = params.get('q')?.trim();
    if (search) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { brand: { contains: search, mode: 'insensitive' } },
            { model: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const page = boundedInt(params.get('page'), 1, 10_000);
    const pageSize = boundedInt(params.get('limit'), 12, 60);
    const sort = params.get('sort');
    const orderBy: Prisma.ListingOrderByWithRelationInput = sort === 'price-asc'
      ? { price: 'asc' }
      : sort === 'price-desc'
        ? { price: 'desc' }
        : { createdAt: 'desc' };
    const [rows, total] = await prisma.$transaction([
      prisma.listing.findMany({
        where,
        include: { seller: { select: listingSellerSelect } },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.listing.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: rows.map(serializeListing),
      pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('Listings query failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to load listings.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, profile } = await getCurrentProfile(request);
    if (!user || !profile) return NextResponse.json({ message: 'Please sign in to post a listing.' }, { status: 401 });

    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ message: 'Invalid listing data.' }, { status: 400 });
    }
    const input = body as Record<string, unknown>;
    const brand = String(input.brand ?? input.make ?? '').trim();
    const model = String(input.model ?? '').trim();
    const title = String(input.title ?? `${brand} ${model}`.trim()).trim();
    const location = String(input.location ?? input.city ?? '').trim();
    const price = Number(input.price);
    const description = String(input.description ?? '').trim();
    if (!title || !brand || !location || !description || !Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ message: 'Title, brand, location, description, and a valid price are required.' }, { status: 400 });
    }

    const data = {
      title: title.slice(0, 180),
      brand: brand.slice(0, 100),
      model: model.slice(0, 120) || null,
      year: input.year == null ? null : String(input.year).slice(0, 20),
      price,
      location: location.slice(0, 160),
      description: description.slice(0, 12_000),
      category: String(input.category ?? 'Machine').trim().slice(0, 100) || 'Machine',
      condition: String(input.condition ?? 'Used').slice(0, 40),
      hours: String(input.hours ?? input.mileage ?? '').slice(0, 40) || null,
      imageUrls: parseImageUrls(input.image_urls ?? input.images),
      phoneNumber: typeof input.phone_number === 'string' ? input.phone_number.slice(0, 40) : null,
      contactOption: typeof input.contact_option === 'string' ? input.contact_option.slice(0, 30) : null,
      sellerId: user.id,
      status: 'active',
      isFeatured: profile.role === 'admin',
    };

    const listing = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM profiles WHERE id = ${user.id}::uuid FOR UPDATE`;
      if (profile.role === 'regular') {
        const count = await tx.listing.count({ where: { sellerId: user.id } });
        if (count >= 3) throw new Error('AD_LIMIT_REACHED');
      }
      return tx.listing.create({ data, include: { seller: { select: listingSellerSelect } } });
    });
    return NextResponse.json({ success: true, listing: serializeListing(listing) }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'AD_LIMIT_REACHED') {
      return NextResponse.json({ code: 'AD_LIMIT_REACHED', message: 'You have reached the 3-listing limit. Submit a seller application to post more.' }, { status: 403 });
    }
    console.error('Create listing failed:', error);
    return NextResponse.json({ message: 'Unable to create listing.' }, { status: 500 });
  }
}
