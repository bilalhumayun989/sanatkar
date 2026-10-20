import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile, getCurrentUser } from '@/lib/auth/supabase/server';
import { PATCH as updateListing } from '@/app/api/listings/[id]/route';

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ message: 'Product not found' }, { status: 404 });
  try {
    const row = await prisma.listing.findUnique({
      where: { id },
      include: { seller: { select: { id: true, username: true, role: true, phone: true } } },
    });
    if (!row) return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    if (row.status !== 'active' && row.status !== 'sold') {
      const { user } = await getCurrentUser(request);
      if (!user || (row.sellerId !== user.id && (await prisma.profile.findUnique({ where: { id: user.id }, select: { role: true } }))?.role !== 'admin')) {
        return NextResponse.json({ message: 'Product not found' }, { status: 404 });
      }
    }
    return NextResponse.json({
      id: row.id,
      make: row.brand ?? '',
      model: row.model ?? row.title,
      year: Number(row.year) || 0,
      price: Number(row.price),
      description: row.description ?? '',
      images: row.imageUrls,
      sellerId: row.sellerId,
      seller: row.seller ? { id: row.seller.id, name: row.seller.username, username: row.seller.username, role: row.seller.role, phone: row.seller.phone } : null,
      condition: row.condition ?? 'Used',
      category: row.category ?? '',
      mileage: Number(row.hours) || 0,
      location: row.location,
      status: row.status === 'active' ? 'available' : row.status,
      isFeatured: row.isFeatured ?? false,
      createdAt: row.createdAt,
    });
  } catch (error) {
    console.error('Product query failed:', error);
    return NextResponse.json({ message: 'Unable to load product.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: Context) {
  return updateListing(request, context);
}

export async function DELETE(request: NextRequest, context: Context) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || !profile) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const { id } = await context.params;
  const listing = await prisma.listing.findUnique({ where: { id }, select: { sellerId: true } });
  if (!listing) return NextResponse.json({ message: 'Product not found' }, { status: 404 });
  if (listing.sellerId !== user.id && profile.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  try {
    await prisma.listing.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: 'This listing cannot be deleted while it has related activity.' }, { status: 409 });
  }
}
