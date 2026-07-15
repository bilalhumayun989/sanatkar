import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/dbConn';
import { verifyToken } from '@/lib/auth';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const token = request.cookies.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        const { status } = await request.json();
        if (!status) {
            return NextResponse.json({ success: false, message: 'Status is required' }, { status: 400 });
        }

        const order = await prisma.order.findUnique({ where: { id } });
        if (!order) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        if (order.sellerId !== payload.id && payload.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const updatedOrder = await prisma.order.update({
            where: { id },
            data: { status },
        });

        return NextResponse.json({ success: true, order: updatedOrder });
    } catch (error: any) {
        console.error('Update order status error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
