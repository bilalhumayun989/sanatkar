import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentUser } from '@/lib/auth/supabase/server';
import { randomUUID } from 'crypto';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
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
      // Get authenticated user — but views work for everyone including guests
      const { user } = await getCurrentUser(request);

      // Sellers don't inflate their own view counts
      if (user?.id && user.id === listing.sellerId) {
        return NextResponse.json({ success: true });
      }

      // For authenticated users use their real ID; for guests use/assign a visitor cookie
      let viewerId: string;
      let visitorCookieValue: string | null = null;

      if (user?.id && uuidPattern.test(user.id)) {
        viewerId = user.id;
      } else {
        // Use an existing visitor cookie or mint a new one
        const existing = request.cookies.get('_sv')?.value;
        if (existing && uuidPattern.test(existing)) {
          viewerId = existing;
        } else {
          viewerId = randomUUID();
          visitorCookieValue = viewerId;
        }
      }

      await prisma.listingView.upsert({
        where: { listingId_viewerId: { listingId: id, viewerId } },
        create: { listingId: id, viewerId },
        // Update timestamp so the 30-day window resets on re-visit — keeps trending fresh
        update: { firstViewedAt: new Date() },
      });

      const response = NextResponse.json({ success: true });
      // Set visitor cookie for 90 days if we just minted one
      if (visitorCookieValue) {
        response.cookies.set('_sv', visitorCookieValue, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 90,
        });
      }
      return response;

    } else {
      // Share — still requires auth
      const { user } = await getCurrentUser(request);
      if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
      const eventId = typeof input.event_id === 'string' ? input.event_id : '';
      if (!uuidPattern.test(eventId)) return NextResponse.json({ success: false, message: 'Invalid share event.' }, { status: 400 });
      await prisma.listingShare.upsert({
        where: { eventId },
        create: { listingId: id, sharerId: user.id, eventId },
        update: {},
      });
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Listing interaction failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to record listing activity.' }, { status: 503 });
  }
}
