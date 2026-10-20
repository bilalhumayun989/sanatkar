import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';

export async function GET(request: NextRequest) {
  const { user } = await getCurrentProfile(request);
  if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const orders = await prisma.order.findMany({
      where: { buyerId: user.id },
      include: { seller: { select: { username: true, email: true } }, product: { select: { title: true, brand: true, model: true, price: true, imageUrls: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error('Buyer orders query failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to load orders.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user } = await getCurrentProfile(request);
  if (!user) return NextResponse.json({ success: false, message: 'Please sign in to place an order.' }, { status: 401 });
  const body: unknown = await request.json();
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, message: 'Invalid order.' }, { status: 400 });
  const input = body as Record<string, unknown>;
  const productId = typeof input.productId === 'string' ? input.productId : '';
  const quantity = Number(input.quantity ?? 1);
  if (!/^[0-9a-f-]{36}$/i.test(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
    return NextResponse.json({ success: false, message: 'Invalid product or quantity.' }, { status: 400 });
  }
  const rawShipping = input.shippingAddress;
  const shipping = typeof rawShipping === 'string' ? { address: rawShipping } : rawShipping && typeof rawShipping === 'object' ? rawShipping as Record<string, unknown> : {};
  const fullName = typeof shipping.fullName === 'string' ? shipping.fullName.trim().slice(0, 120) : '';
  const phone = typeof shipping.phone === 'string' ? shipping.phone.trim().slice(0, 40) : '';
  const address = typeof shipping.address === 'string' ? shipping.address.trim().slice(0, 500) : '';
  const city = typeof shipping.city === 'string' ? shipping.city.trim().slice(0, 100) : '';
  if (!fullName || !phone || !address || !city) return NextResponse.json({ success: false, message: 'Complete shipping name, phone, address, and city.' }, { status: 400 });

  try {
    const order = await prisma.$transaction(async tx => {
      const product = await tx.listing.findUnique({ where: { id: productId } });
      if (!product || product.status !== 'active' || !product.sellerId) throw new Error('PRODUCT_UNAVAILABLE');
      if (product.sellerId === user.id) throw new Error('OWN_PRODUCT');
      const reserved = await tx.listing.updateMany({ where: { id: productId, status: 'active' }, data: { status: 'sold' } });
      if (reserved.count !== 1) throw new Error('PRODUCT_UNAVAILABLE');
      return tx.order.create({ data: {
        buyerId: user.id,
        sellerId: product.sellerId,
        productId: product.id,
        quantity,
        totalPrice: product.price.mul(quantity),
        status: 'pending',
        shippingFullName: fullName,
        shippingPhone: phone,
        shippingAddress: address,
        shippingCity: city,
      } });
    });
    return NextResponse.json({ success: true, orderId: order.id }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'OWN_PRODUCT') return NextResponse.json({ success: false, message: 'You cannot buy your own listing.' }, { status: 400 });
    if (code === 'PRODUCT_UNAVAILABLE') return NextResponse.json({ success: false, message: 'This listing is no longer available.' }, { status: 409 });
    console.error('Order creation failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to place this order.' }, { status: 500 });
  }
}
