import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { user } = await getCurrentProfile(request);
  if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const listings = await prisma.listing.findMany({ where: { sellerId: user.id }, select: { id: true } });
    const ids = listings.map(row => row.id);
    if (!ids.length) return NextResponse.json({ success: true, stats: [] });
    const [views, shares, chats, offers] = await Promise.all([
      prisma.listingView.groupBy({ by: ['listingId'], where: { listingId: { in: ids } }, _count: { _all: true } }),
      prisma.listingShare.groupBy({ by: ['listingId'], where: { listingId: { in: ids }, sharerId: { not: user.id } }, _count: { _all: true } }),
      prisma.chat.groupBy({ by: ['listingId'], where: { listingId: { in: ids } }, _count: { _all: true } }),
      prisma.offer.groupBy({ by: ['listingId'], where: { listingId: { in: ids } }, _count: { _all: true } }),
    ]);
    const countMap = (rows: { listingId: string | null; _count: { _all: number } }[]) =>
      new Map(rows.map(row => [row.listingId, row._count._all]));
    const viewCounts = countMap(views), shareCounts = countMap(shares), chatCounts = countMap(chats), offerCounts = countMap(offers);
    return NextResponse.json({ success: true, stats: ids.map(id => ({
      listing_id: id,
      views: viewCounts.get(id) ?? 0,
      shares: shareCounts.get(id) ?? 0,
      messages: chatCounts.get(id) ?? 0,
      offers: offerCounts.get(id) ?? 0,
    })) });
  } catch (error) {
    console.error('Listing stats query failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to load listing statistics.' }, { status: 503 });
  }
}
