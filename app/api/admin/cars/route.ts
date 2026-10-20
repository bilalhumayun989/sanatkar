import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';

export async function GET(request: NextRequest) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || profile?.role !== 'admin') return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });
  try {
    const rows = await prisma.listing.findMany({
      include: { seller: { select: { id: true, username: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const cars = rows.map(row => ({
      id: row.id,
      make: row.brand ?? '',
      model: row.model ?? row.title,
      year: Number(row.year) || 0,
      price: Number(row.price),
      description: row.description ?? '',
      images: row.imageUrls,
      sellerId: row.sellerId,
      seller: row.seller ? { id: row.seller.id, name: row.seller.username, email: row.seller.email } : null,
      condition: row.condition ?? 'Used',
      category: row.category ?? '',
      mileage: Number(row.hours) || 0,
      location: row.location,
      status: row.status,
      isFeatured: row.isFeatured ?? false,
      createdAt: row.createdAt,
    }));
    return NextResponse.json({ success: true, cars });
  } catch (error) {
    console.error('Admin listings query failed:', error);
    return NextResponse.json({ message: 'Unable to load listings.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || profile?.role !== 'admin') return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });
  const body: unknown = await request.json();
  const id = body && typeof body === 'object' && 'id' in body ? (body as { id?: unknown }).id : null;
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ message: 'A valid listing id is required.' }, { status: 400 });
  try {
    await prisma.listing.update({ where: { id }, data: { status: 'removed' } });
    return NextResponse.json({ success: true, message: 'Listing archived.' });
  } catch (error) {
    console.error('Admin listing archive failed:', error);
    return NextResponse.json({ message: 'Listing not found.' }, { status: 404 });
  }
}
