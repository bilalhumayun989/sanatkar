import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || !profile) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const requestedId = request.nextUrl.searchParams.get('id');
    if (requestedId !== null && !uuidPattern.test(requestedId)) {
      return NextResponse.json({ success: false, message: 'Invalid notification ID.' }, { status: 400 });
    }
    const [{ count: unreadCount }] = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT count(*)::int AS count FROM public.notifications
      WHERE user_id = ${user.id}::uuid AND is_read IS DISTINCT FROM true`;
    if (request.nextUrl.searchParams.get('summary') === 'true') {
      return NextResponse.json({ success: true, unread_count: unreadCount });
    }
    const unreadOnly = request.nextUrl.searchParams.get('unread') === 'true';
    const records = await prisma.$queryRaw<Array<{
      id: string; user_id: string; title: string; message: string; type: string;
      is_read: boolean; created_at: Date; metadata: Record<string, unknown>;
    }>>`SELECT id, user_id, title, message, type, coalesce(is_read, false) AS is_read, created_at, metadata
      FROM public.notifications WHERE user_id = ${user.id}::uuid
        AND (${!unreadOnly} OR is_read IS DISTINCT FROM true)
        AND (${requestedId === null} OR id = ${requestedId}::uuid)
      ORDER BY created_at DESC, id DESC LIMIT 100`;
    const notifications = records.map(row => ({ ...row, created_at: row.created_at?.toISOString() ?? null }));
    if (request.nextUrl.searchParams.get('format') === 'records') {
      return NextResponse.json({ success: true, notifications, unread_count: unreadCount });
    }

    const offers = await prisma.offer.findMany({
      where: { sellerId: user.id },
      include: {
        listing: { select: { title: true } },
        buyer: { select: { fullName: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const chats = await prisma.chat.findMany({
      where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
      include: {
        listing: { select: { title: true } },
        buyer: { select: { fullName: true, username: true } },
        seller: { select: { fullName: true, username: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const chatNotifications = await Promise.all(
      chats.map(async (chat) => {
        const latest = await prisma.message.findFirst({
          where: {
            chatId: chat.id,
            senderId: { not: user.id },
            isRead: false,
          },
          orderBy: { createdAt: 'desc' },
        });
        if (!latest) return null;

        const unreadCount = await prisma.message.count({
          where: {
            chatId: chat.id,
            senderId: { not: user.id },
            isRead: false,
          },
        });

        const otherUser = chat.buyerId === user.id ? chat.seller : chat.buyer;
        return {
          chatId: chat.id,
          senderName: otherUser?.fullName || otherUser?.username || 'Buyer',
          listingTitle: chat.listing?.title || 'Conversation',
          content: latest.content || 'Sent a message',
          createdAt: latest.createdAt ? latest.createdAt.toISOString() : new Date().toISOString(),
          unreadCount,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      notifications,
      unread_count: unreadCount,
      offers: offers.map((offer) => ({
        id: offer.id,
        offer_price: Number(offer.offerPrice),
        status: offer.status || 'pending',
        created_at: offer.createdAt ? offer.createdAt.toISOString() : null,
        listing: offer.listing ? { title: offer.listing.title } : null,
        buyer: offer.buyer ? { full_name: offer.buyer.fullName, username: offer.buyer.username } : null,
      })),
      chat_notifications: chatNotifications.filter(Boolean),
    });
  } catch (error) {
    console.error('Notifications lookup failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to load notifications.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { user } = await getCurrentProfile(request);
  if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ success: false, message: 'Invalid notification update.' }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  const all = input.all === true;
  if (!all && (typeof input.id !== 'string' || !uuidPattern.test(input.id))) {
    return NextResponse.json({ success: false, message: 'A valid notification ID is required.' }, { status: 400 });
  }
  try {
    const id = all ? null : input.id as string;
    const updated = await prisma.$transaction(async tx => {
      const changed = await tx.$queryRaw<Array<{ metadata: { offer_id?: string } }>>`
        UPDATE public.notifications SET is_read = true
        WHERE user_id = ${user.id}::uuid AND (${all} OR id = ${id}::uuid)
          AND is_read IS DISTINCT FROM true RETURNING metadata`;
      // Preserve offer status semantics, but only on an explicit read action.
      const offerIds = changed.map(row => row.metadata?.offer_id).filter((value): value is string =>
        typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value));
      if (offerIds.length) await tx.offer.updateMany({
        where: { id: { in: offerIds }, sellerId: user.id, status: 'pending' }, data: { status: 'viewed' },
      });
      return changed.length;
    });
    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error('Notification read update failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to update notifications.' }, { status: 500 });
  }
}
