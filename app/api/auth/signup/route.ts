import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConn';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { name, email, password } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json({ success: false, message: 'Please provide name, email and password' }, { status: 400 });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return NextResponse.json({ success: false, message: 'User already exists' }, { status: 400 });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'user',
        });

        const token = await signToken({
            id: user._id.toString(),
            email: user.email,
            role: user.role,
        });

        const response = NextResponse.json({
            success: true,
            message: 'User registered successfully',
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        }, { status: 201 });

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
