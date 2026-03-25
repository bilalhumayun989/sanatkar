import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const response = NextResponse.json({
            success: true,
            message: 'Logged out successfully'
        });

        response.cookies.delete('auth_token');

        return response;
    } catch (error: any) {
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
