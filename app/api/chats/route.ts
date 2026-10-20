import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';

export async function GET(request: NextRequest) {
  const { user } = await getCurrentProfile(request);
  if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const chats = await prisma.chat.findMany({
      where: {
        OR: [{ buyerId: user.id }, { sellerId: user.id }],
        hiddenFor: { none: { userId: user.id } },
      },
      include: {
        listing: { select: { id: true, title: true, price: true, imageUrls: true, brand: true, category: true } },
        buyer: { select: { id: true, username: true, fullName: true } },
        seller: { select: { id: true, username: true, fullName: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, content: true, createdAt: true, senderId: true, isRead: true, type: true, offerAmount: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const payload = await Promise.all(chats.map(async (chat) => {
      const otherUser = chat.buyerId === user.id ? chat.seller : chat.buyer;
      const latestMessage = chat.messages[0] ?? null;
      const unreadCount = await prisma.message.count({
        where: { chatId: chat.id, senderId: { not: user.id }, isRead: false },
      });
      return {
        id: chat.id,
        buyer_id: chat.buyerId,
        seller_id: chat.sellerId,
        created_at: chat.createdAt?.toISOString() ?? null,
        updated_at: chat.updatedAt?.toISOString() ?? chat.createdAt?.toISOString() ?? null,
        listing: chat.listing ? {
          id: chat.listing.id,
          title: chat.listing.title,
          price: Number(chat.listing.price),
          image_urls: chat.listing.imageUrls ?? [],
          brand: chat.listing.brand,
          category: chat.listing.category,
        } : null,
        otherUser: otherUser ? { id: otherUser.id, username: otherUser.username, full_name: otherUser.fullName } : null,
        latestMessage: latestMessage ? {
          id: latestMessage.id,
          content: latestMessage.content,
          created_at: latestMessage.createdAt?.toISOString() ?? null,
          sender_id: latestMessage.senderId,
          is_read: latestMessage.isRead ?? false,
          type: latestMessage.type,
          offer_amount: latestMessage.offerAmount ? Number(latestMessage.offerAmount) : null,
        } : null,
        unreadCount,
      };
    }));

    return NextResponse.json({ success: true, chats: payload });
  } catch (error) {
    console.error('Chat list lookup failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to load chats.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user } = await getCurrentProfile(request);
  if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ success: false, message: 'Invalid chat request.' }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const listingId = typeof input.listing_id === 'string' ? input.listing_id : typeof input.listingId === 'string' ? input.listingId : null;
  const sellerId = typeof input.seller_id === 'string' ? input.seller_id : typeof input.sellerId === 'string' ? input.sellerId : null;
  if (!listingId || !sellerId) {
    return NextResponse.json({ success: false, message: 'Listing and seller are required.' }, { status: 400 });
  }

  try {
    const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { id: true, sellerId: true, status: true } });
    if (!listing) return NextResponse.json({ success: false, message: 'Listing not found.' }, { status: 404 });
    if (listing.status !== 'active' || !listing.sellerId || listing.sellerId !== sellerId || listing.sellerId === user.id) {
      return NextResponse.json({ success: false, message: 'The listing recipient is invalid.' }, { status: 400 });
    }

    const existing = await prisma.chat.findFirst({
      where: { listingId, buyerId: user.id, sellerId },
    });
    if (existing) return NextResponse.json({ success: true, chat: existing });

    const chat = await prisma.chat.create({
      data: { listingId, buyerId: user.id, sellerId },
    });
    return NextResponse.json({ success: true, chat }, { status: 201 });
  } catch (error) {
    console.error('Chat creation failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to create chat.' }, { status: 500 });
  }
}
