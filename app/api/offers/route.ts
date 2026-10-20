import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || !profile) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ success: false, message: 'Invalid offer request.' }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  const listingId = typeof input.listing_id === 'string' ? input.listing_id : '';
  const amount = Number(input.amount);
  const content = typeof input.message === 'string' ? input.message.trim().slice(0, 4000) : '';
  if (!uuidPattern.test(listingId) || !Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) {
    return NextResponse.json({ success: false, message: 'A valid listing and offer amount are required.' }, { status: 400 });
  }

  try {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, sellerId: true, status: true },
    });
    if (!listing || listing.status !== 'active' || !listing.sellerId) {
      return NextResponse.json({ success: false, message: 'Listing is unavailable.' }, { status: 404 });
    }
    if (listing.sellerId === user.id) {
      return NextResponse.json({ success: false, message: 'You cannot make an offer on your own listing.' }, { status: 403 });
    }

    const chat = await prisma.$transaction(async tx => {
      let conversation = await tx.chat.findFirst({
        where: { listingId, buyerId: user.id, sellerId: listing.sellerId },
        select: { id: true },
      });
      if (!conversation) {
        conversation = await tx.chat.create({
          data: { listingId, buyerId: user.id, sellerId: listing.sellerId },
          select: { id: true },
        });
      } else {
        await tx.chatHiddenFor.deleteMany({ where: { chatId: conversation.id, userId: user.id } });
      }

      await tx.offer.create({
        data: { listingId, buyerId: user.id, sellerId: listing.sellerId, offerPrice: amount, status: 'pending' },
      });
      const message = await tx.message.create({
        data: {
          chatId: conversation.id,
          senderId: user.id,
          content: content || `I would like to offer PKR ${amount.toLocaleString()} for this item.`,
          type: 'offer',
          offerAmount: amount,
          isRead: false,
        },
      });
      await tx.chat.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });
      return { chatId: conversation.id, messageId: message.id };
    });

    return NextResponse.json({ success: true, chat_id: chat.chatId }, { status: 201 });
  } catch (error) {
    console.error('Offer submission failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to send offer.' }, { status: 500 });
  }
}
