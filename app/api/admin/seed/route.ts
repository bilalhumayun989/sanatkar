import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConn';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

// One-time seed route to create/reset admin user
// Call GET /api/admin/seed to create the admin
export async function GET() {
    try {
        await dbConnect();

        const email = 'admin@pakwheels.com';
        const plainPassword = 'admin123';

        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // Upsert: update if exists, create if not
        const admin = await User.findOneAndUpdate(
            { email },
            {
                name: 'Admin',
                email,
                password: hashedPassword,
                role: 'admin',
            },
            { upsert: true, new: true, runValidators: false }
        );

        return NextResponse.json({
            success: true,
            message: 'Admin user created/updated successfully',
            credentials: {
                email: 'admin@pakwheels.com',
                password: 'admin123',
                login_at: '/admin'
            }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
