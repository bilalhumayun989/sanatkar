import { NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { buyerId, productId, sellerId, totalPrice, shippingAddress } = body;

        if (!buyerId || !productId || !sellerId || !totalPrice || !shippingAddress) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        if (buyerId === sellerId) {
            return NextResponse.json({ success: false, message: 'You cannot buy your own product' }, { status: 400 });
        }

        // Check if product exists and is available
        const product = await prisma.car.findUnique({ where: { id: productId } });
        if (!product || product.status === 'sold') {
            return NextResponse.json({ success: false, message: 'Product is no longer available' }, { status: 404 });
        }

        // Parse shipping address fields
        const { fullName, phone, address, city } = shippingAddress;

        const order = await prisma.order.create({
            data: {
                buyerId,
                sellerId,
                productId,
                totalPrice: Number(totalPrice),
                status: 'pending',
                shippingFullName: fullName || '',
                shippingPhone: phone || '',
                shippingAddress: address || (typeof shippingAddress === 'string' ? shippingAddress : ''),
                shippingCity: city || '',
            },
        });

        // Mark product as sold to prevent double buying
        await prisma.car.update({
            where: { id: productId },
            data: { status: 'sold' },
        });

        return NextResponse.json({ success: true, orderId: order.id }, { status: 201 });
    } catch (error: any) {
        console.error('Order creation error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
