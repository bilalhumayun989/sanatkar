import { NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';

export async function GET(request: Request) {
    try {
        // await dbConnect();
        
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: { verifyToken: token },
        });

        console.log('Verification attempt for token:', token);
        if (user) {
            console.log('User found:', user.email);
            console.log('Token expires at:', user.verifyTokenExpire);
            console.log('Current time:', new Date());
            
            if (user.verifyTokenExpire && user.verifyTokenExpire < new Date()) {
                console.log('Token EXPIRED');
            }
        } else {
            console.log('User NOT found with this token');
        }

        if (!user || (user.verifyTokenExpire && user.verifyTokenExpire < new Date())) {
            return NextResponse.json({ success: false, message: 'Invalid or expired token' }, { status: 400 });
        }

        // Mark as verified
        await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                verifyToken: null,
                verifyTokenExpire: null,
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Email verified successfully'
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
    }
}
