import { NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json({ success: false, message: 'Please provide token and password' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ success: false, message: 'Password should be at least 6 characters' }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordExpire: { gt: new Date() },
            },
        });

        if (!user) {
            return NextResponse.json({ success: false, message: 'Invalid or expired token' }, { status: 400 });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update password and clear reset fields
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpire: null,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Password reset successful'
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
    }
}
