import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ success: false, user: null }, { status: 401 });
        }

        const payload = await verifyToken(token);

        if (!payload) {
            return NextResponse.json({ success: false, user: null }, { status: 401 });
        }

        return NextResponse.json({
            success: true,
            user: {
                id: payload.id,
                email: payload.email,
                role: payload.role
            }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: 'Server error', user: null }, { status: 500 });
    }
}
