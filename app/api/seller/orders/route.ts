import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';

export async function GET(request: NextRequest) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || !profile) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  if (!['seller', 'admin'].includes(profile.role)) return NextResponse.json({ success: false, message: 'Seller access required.' }, { status: 403 });
  try {
    const orders = await prisma.order.findMany({
      where: profile.role === 'admin' ? {} : { sellerId: user.id },
      include: {
        buyer: { select: { username: true, fullName: true, email: true } },
        product: { select: { title: true, brand: true, model: true, price: true, imageUrls: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, orders: orders.map(order => ({
      ...order,
      buyer: { name: order.buyer.fullName || order.buyer.username, email: order.buyer.email },
      product: {
        make: order.product.brand ?? '',
        model: order.product.model ?? order.product.title,
        price: Number(order.product.price),
        images: order.product.imageUrls,
      },
      totalPrice: Number(order.totalPrice),
    })) });
  } catch (error) {
    console.error('Seller orders query failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to load orders.' }, { status: 500 });
  }
}
