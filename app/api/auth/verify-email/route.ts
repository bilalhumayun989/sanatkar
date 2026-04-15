import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConn';
import User from '@/lib/models/User';

export async function GET(request: Request) {
    try {
        await dbConnect();
        
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 400 });
        }

        const user = await User.findOne({
            verifyToken: token,
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
        user.isVerified = true;
        user.verifyToken = undefined;
        user.verifyTokenExpire = undefined;
        await user.save();

        return NextResponse.json({
            success: true,
            message: 'Email verified successfully'
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
    }
}
