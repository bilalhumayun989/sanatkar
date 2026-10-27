import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentUser } from '@/lib/auth/supabase/server';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { user } = await getCurrentUser(request);
  if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  if (!uuidPattern.test(id)) return NextResponse.json({ success: false, message: 'Listing not found.' }, { status: 404 });
  const input = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!input || !['view', 'share'].includes(String(input.type))) {
    return NextResponse.json({ success: false, message: 'Invalid listing interaction.' }, { status: 400 });
  }
  try {
    const listing = await prisma.listing.findUnique({ where: { id }, select: { id: true, status: true, sellerId: true } });
    if (!listing || listing.status !== 'active') return NextResponse.json({ success: false, message: 'Listing not found.' }, { status: 404 });
    if (input.type === 'view') {
      if (user.id !== listing.sellerId) {
        await prisma.listingView.upsert({
          where: { listingId_viewerId: { listingId: id, viewerId: user.id } },
          create: { listingId: id, viewerId: user.id },
          update: {},
        });
      }
    } else {
      const eventId = typeof input.event_id === 'string' ? input.event_id : '';
      if (!uuidPattern.test(eventId)) return NextResponse.json({ success: false, message: 'Invalid share event.' }, { status: 400 });
      await prisma.listingShare.upsert({
        where: { eventId },
        create: { listingId: id, sharerId: user.id, eventId },
        update: {},
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Listing interaction failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to record listing activity.' }, { status: 503 });
  }
}
