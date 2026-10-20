import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';

type Context = { params: Promise<{ id: string }> };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function DELETE(request: NextRequest, { params }: Context) {
  const { user } = await getCurrentProfile(request);
  if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  if (!uuidPattern.test(id)) return NextResponse.json({ success: false, message: 'Chat not found.' }, { status: 404 });

  try {
    const chat = await prisma.chat.findFirst({
      where: { id, OR: [{ buyerId: user.id }, { sellerId: user.id }] },
      select: { id: true },
    });
    if (!chat) return NextResponse.json({ success: false, message: 'Chat not found.' }, { status: 404 });

    await prisma.chatHiddenFor.upsert({
      where: { chatId_userId: { chatId: id, userId: user.id } },
      update: { hiddenAt: new Date() },
      create: { chatId: id, userId: user.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Chat hide failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to hide chat.' }, { status: 500 });
  }
}
