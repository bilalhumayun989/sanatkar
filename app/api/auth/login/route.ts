import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConn';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ success: false, message: 'Please provide email and password' }, { status: 400 });
        }

        // Add special case for admin/admin123
        if ((email === 'admin@SANATkar.com' || email === 'admin') && password === 'admin123') {
            const token = await signToken({
                id: '6742cc43666b6182c44369e1', // A placeholder valid ObjectId structure
                email: 'admin@SANATkar.com',
                role: 'admin',
            });

            const response = NextResponse.json({
                success: true,
                message: 'Admin logged in successfully',
                user: { id: '6742cc43666b6182c44369e1', name: 'System Admin', email: 'admin@SANATkar.com', role: 'admin' }
            });

            response.cookies.set({
                name: 'auth_token',
                value: token,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60,
                path: '/',
            });

            return response;
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
        }

        if (!user.password || !await bcrypt.compare(password, user.password)) {
            return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
        }


        const token = await signToken({
            id: user._id.toString(),
            email: user.email,
            role: user.role,
        });

        const response = NextResponse.json({
            success: true,
            message: 'Logged in successfully',
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });

        response.cookies.set({
            name: 'auth_token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/',
        });

        return response;
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
    }
}
