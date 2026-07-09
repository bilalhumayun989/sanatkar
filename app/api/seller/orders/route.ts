import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/dbConn';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload || (payload.role !== 'seller' && payload.role !== 'admin')) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        const orders = await prisma.order.findMany({
            where: { sellerId: payload.id as string },
            include: {
                buyer: { select: { name: true, email: true } },
                product: { select: { make: true, model: true, price: true, images: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ success: true, orders });
    } catch (error: any) {
        console.error('Fetch seller orders error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
