import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConn';
import User from '@/lib/models/User';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/mail';

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ success: false, message: 'Please provide an email' }, { status: 400 });
        }

        const user = await User.findOne({ email });

        if (!user) {
            // To prevent email enumeration, we still return a success message
            return NextResponse.json({
                success: true,
                message: 'If an account with that email exists, we have sent a password reset link.'
            }, { status: 200 });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpire = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = resetTokenExpire;
        await user.save();

        // Send reset email
        try {
            await sendPasswordResetEmail(email, resetToken);
        } catch (emailError: any) {
            console.error('Reset email error:', emailError);
            return NextResponse.json({ success: false, message: 'Error sending reset email' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'If an account with that email exists, we have sent a password reset link.'
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
    }
}
