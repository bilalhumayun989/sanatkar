import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConn';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json({ success: false, message: 'Please provide token and password' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ success: false, message: 'Password should be at least 6 characters' }, { status: 400 });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return NextResponse.json({ success: false, message: 'Invalid or expired token' }, { status: 400 });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update password and clear reset fields
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        return NextResponse.json({
            success: true,
            message: 'Password reset successful'
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
    }
}
