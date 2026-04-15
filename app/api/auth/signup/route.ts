import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConn';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/mail';

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { name, email, password, role, pakwheelsUrl, darazUrl } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json({ success: false, message: 'Please provide name, email and password' }, { status: 400 });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return NextResponse.json({ success: false, message: 'User already exists' }, { status: 400 });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate verification token
        const verifyToken = crypto.randomBytes(32).toString('hex');
        const verifyTokenExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'user',
            pakwheelsUrl: role === 'seller' ? pakwheelsUrl : undefined,
            darazUrl: role === 'seller' ? darazUrl : undefined,
            isVerified: false,
            verifyToken,
            verifyTokenExpire,
        });

        // Send verification email
        try {
            await sendVerificationEmail(email, verifyToken);
        } catch (emailError: any) {
            console.error('Email error:', emailError);
            // We still created the user, they might need to request a resend later
            // For now, we'll return success but note that email might have failed in logs
        }

        return NextResponse.json({
            success: true,
            message: 'Registration successful! Please check your email to verify your account.',
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
    }
}
