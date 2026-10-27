import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile, getCurrentUser } from '@/lib/auth/supabase/server';
import { listingSellerSelect, parseImageUrls, serializeListing } from '@/lib/listings';
import { sellerListingGate } from '@/lib/seller-activation';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  if (!uuidPattern.test(id)) return NextResponse.json({ success: false, message: 'Listing not found.' }, { status: 404 });
  try {
    const row = await prisma.listing.findUnique({ where: { id }, include: { seller: { select: listingSellerSelect } } });
    if (!row) return NextResponse.json({ success: false, message: 'Listing not found.' }, { status: 404 });
    if (row.status !== 'active') {
      const { user } = await getCurrentUser(request);
      if (!user || (row.sellerId !== user.id && (await prisma.profile.findUnique({ where: { id: user.id }, select: { role: true } }))?.role !== 'admin')) {
        return NextResponse.json({ success: false, message: 'Listing not found.' }, { status: 404 });
      }
    }
    return NextResponse.json({ success: true, listing: serializeListing(row) });
  } catch (error) {
    console.error('Listing lookup failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to load listing.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  if (!uuidPattern.test(id)) return NextResponse.json({ message: 'Listing not found.' }, { status: 404 });
  try {
    const { user, profile } = await getCurrentProfile(request);
    if (!user || !profile) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const existing = await prisma.listing.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ message: 'Listing not found.' }, { status: 404 });
    if (existing.sellerId !== user.id && profile.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ message: 'Invalid listing data.' }, { status: 400 });
    const input = body as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    const stringField = (key: string, max: number, alias?: string) => {
      const value = input[key] ?? (alias ? input[alias] : undefined);
      if (typeof value === 'string') data[key] = value.trim().slice(0, max);
    };

    stringField('title', 180);
    stringField('brand', 100, 'make');
    stringField('model', 120);
    stringField('location', 160);
    stringField('description', 12_000);
    stringField('category', 100);
    stringField('condition', 40);
    stringField('origin', 100);
    stringField('stockStatus', 60, 'stock_status');
    stringField('phoneNumber', 40, 'phone_number');
    stringField('contactOption', 30, 'contact_option');
    if (input.year !== undefined) data.year = input.year === null ? null : String(input.year).slice(0, 20);
    if (input.hours !== undefined || input.mileage !== undefined) data.hours = String(input.hours ?? input.mileage ?? '').slice(0, 40) || null;
    if (input.price !== undefined) {
      const price = Number(input.price);
      if (!Number.isFinite(price) || price <= 0) return NextResponse.json({ message: 'Price must be greater than zero.' }, { status: 400 });
      data.price = price;
    }
    if (input.image_urls !== undefined || input.images !== undefined) data.imageUrls = parseImageUrls(input.image_urls ?? input.images);
    if (input.status !== undefined) {
      if (!['active', 'paused', 'sold'].includes(String(input.status))) return NextResponse.json({ message: 'Invalid listing status.' }, { status: 400 });
      data.status = input.status;
      const gate = sellerListingGate(profile);
      if (input.status === 'active' && gate) return NextResponse.json({ success: false, code: gate, message: 'Complete shop setup and seller payment approval before publishing listings.' }, { status: 403 });
    }
    if (profile.role === 'admin' && typeof input.is_featured === 'boolean') data.isFeatured = input.is_featured;
    if (Object.keys(data).length === 0) return NextResponse.json({ message: 'No supported changes were provided.' }, { status: 400 });

    const updated = await prisma.listing.update({ where: { id }, data: data as never, include: { seller: { select: listingSellerSelect } } });
    return NextResponse.json({ success: true, listing: serializeListing(updated) });
  } catch (error) {
    console.error('Listing update failed:', error);
    return NextResponse.json({ message: 'Unable to update listing.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  if (!uuidPattern.test(id)) return NextResponse.json({ message: 'Listing not found.' }, { status: 404 });
  try {
    const { user, profile } = await getCurrentProfile(request);
    if (!user || !profile) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const row = await prisma.listing.findUnique({ where: { id }, select: { id: true, sellerId: true } });
    if (!row) return NextResponse.json({ message: 'Listing not found.' }, { status: 404 });
    if (row.sellerId !== user.id && profile.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    await prisma.$transaction(async tx => {
      // Remove analytics rows first because the legacy foreign keys are
      // restrictive and these counters are meaningful only while the listing exists.
      await tx.listingView.deleteMany({ where: { listingId: id } });
      await tx.listingShare.deleteMany({ where: { listingId: id } });
      await tx.listing.delete({ where: { id } });
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Listing delete failed:', error);
    return NextResponse.json({ message: 'This listing cannot be deleted while it has related activity.' }, { status: 409 });
  }
}
