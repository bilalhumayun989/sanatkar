import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';

export async function GET(request: NextRequest) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || !profile) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.offer.updateMany({
      where: { sellerId: user.id, status: 'pending' },
      data: { status: 'viewed' },
    });

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
