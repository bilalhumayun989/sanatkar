import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { POST as createListing } from '@/app/api/listings/route';

export async function GET() {
  try {
    const deletedSellerIds = (await prisma.deletedAccount.findMany({
      select: { userId: true },
    })).map(account => account.userId);
    const rows = await prisma.listing.findMany({
      where: {
        status: 'active',
        ...(deletedSellerIds.length ? {
          OR: [
            { sellerId: null },
            { sellerId: { notIn: deletedSellerIds } },
          ],
        } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(rows.map(row => ({
      id: row.id,
      make: row.brand ?? '',
      model: row.model ?? row.title,
      year: Number(row.year) || 0,
      price: Number(row.price),
      description: row.description ?? '',
      images: row.imageUrls,
      sellerId: row.sellerId,
      condition: row.condition ?? 'Used',
      category: row.category ?? '',
      mileage: Number(row.hours) || 0,
      location: row.location,
      status: row.status === 'active' ? 'available' : row.status,
      isFeatured: row.isFeatured ?? false,
      createdAt: row.createdAt,
    })));
  } catch (error) {
    console.error('Cars listing query failed:', error);
    return NextResponse.json({ message: 'Unable to load listings.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return createListing(request);
}
