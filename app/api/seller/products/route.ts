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
        if (!payload) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        const products = await prisma.car.findMany({
            where: { sellerId: payload.id as string },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ success: true, products });
    } catch (error: any) {
        console.error('Fetch seller products error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
