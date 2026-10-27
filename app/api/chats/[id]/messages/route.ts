import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { user } = await getCurrentProfile(request);
  if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const chat = await prisma.chat.findFirst({
      where: { id, OR: [{ buyerId: user.id }, { sellerId: user.id }] },
      select: { id: true },
    });
    if (!chat) return NextResponse.json({ success: false, message: 'Chat not found.' }, { status: 404 });

    const after = request.nextUrl.searchParams.get('after');
    const afterDate = after ? new Date(after) : null;
    const messages = await prisma.message.findMany({
      // Inclusive timestamp avoids skipping messages written in the same millisecond;
      // the client deduplicates rows by message ID.
      where: { chatId: id, ...(afterDate && Number.isFinite(afterDate.getTime()) ? { createdAt: { gte: afterDate } } : {}) },
      orderBy: { createdAt: 'asc' },
    });

    const unreadIds = messages.filter((message) => message.senderId !== user.id && !(message.isRead ?? false)).map((message) => message.id);
    if (unreadIds.length > 0) {
      await prisma.message.updateMany({ where: { id: { in: unreadIds } }, data: { isRead: true } });
    }

    return NextResponse.json({ success: true, messages: messages.map((message) => ({
      id: message.id,
      chat_id: message.chatId,
      sender_id: message.senderId,
      content: message.content,
      created_at: message.createdAt?.toISOString() ?? null,
      is_read: message.isRead ?? false,
      type: message.type,
      offer_amount: message.offerAmount ? Number(message.offerAmount) : null,
    })) });
  } catch (error) {
    console.error('Message lookup failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to load messages.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Context) {
  const { user } = await getCurrentProfile(request);
  if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ success: false, message: 'Invalid message payload.' }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const content = typeof input.content === 'string' ? input.content.trim() : '';
  if (!content) return NextResponse.json({ success: false, message: 'Message content is required.' }, { status: 400 });

  try {
    const chat = await prisma.chat.findFirst({ where: { id, OR: [{ buyerId: user.id }, { sellerId: user.id }] }, select: { id: true } });
    if (!chat) return NextResponse.json({ success: false, message: 'Chat not found.' }, { status: 404 });

    const message = await prisma.message.create({
      data: {
        chatId: id,
        senderId: user.id,
        content: content.slice(0, 4000),
        type: typeof input.type === 'string' ? input.type : 'text',
        offerAmount: typeof input.offer_amount === 'number' ? input.offer_amount : null,
        isRead: false,
      },
    });

    await prisma.chat.update({ where: { id }, data: { updatedAt: new Date() } });

    return NextResponse.json({ success: true, message: {
      id: message.id,
      chat_id: message.chatId,
      sender_id: message.senderId,
      content: message.content,
      created_at: message.createdAt?.toISOString() ?? null,
      type: message.type,
      is_read: message.isRead ?? false,
      offer_amount: message.offerAmount ? Number(message.offerAmount) : null,
    } }, { status: 201 });
  } catch (error) {
    console.error('Message send failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to send message.' }, { status: 500 });
  }
}
