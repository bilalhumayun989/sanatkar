import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';

type Context = { params: Promise<{ id: string }> };
const validStatuses = new Set(['confirmed', 'shipped', 'delivered', 'cancelled']);

export async function PATCH(request: NextRequest, { params }: Context) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || !profile) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
  const body: unknown = await request.json();
  const status = body && typeof body === 'object' ? (body as { status?: unknown }).status : undefined;
  if (typeof status !== 'string' || !validStatuses.has(status)) return NextResponse.json({ success: false, message: 'Invalid order status.' }, { status: 400 });

  try {
    const updated = await prisma.$transaction(async tx => {
      const order = await tx.order.findUnique({ where: { id } });
      if (!order) throw new Error('NOT_FOUND');
      const admin = profile.role === 'admin';
      const seller = order.sellerId === user.id;
      const buyer = order.buyerId === user.id;
      if (!admin && !seller && !(buyer && status === 'cancelled')) throw new Error('FORBIDDEN');
      const allowed = admin
        || (order.status === 'pending' && ((seller && ['confirmed', 'cancelled'].includes(status)) || (buyer && status === 'cancelled')))
        || (order.status === 'confirmed' && seller && ['shipped', 'cancelled'].includes(status))
        || (order.status === 'shipped' && seller && status === 'delivered');
      if (!allowed) throw new Error('INVALID_TRANSITION');
      const result = await tx.order.update({ where: { id }, data: { status } });
      if (status === 'cancelled' && order.status === 'pending') {
        await tx.listing.updateMany({ where: { id: order.productId, status: 'sold' }, data: { status: 'active' } });
      }
      return result;
    });
    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'NOT_FOUND') return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
    if (code === 'FORBIDDEN') return NextResponse.json({ success: false, message: 'You are not allowed to update this order.' }, { status: 403 });
    if (code === 'INVALID_TRANSITION') return NextResponse.json({ success: false, message: 'This status transition is not allowed.' }, { status: 409 });
    console.error('Order status update failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to update order.' }, { status: 500 });
  }
}
