import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        // await dbConnect();
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

        let user: any = null;
        let prisma: any = null;

        try {
            const dbModule = await import('@/lib/dbConn');
            prisma = dbModule.default;
            user = await prisma.user.findUnique({ where: { email } });
        } catch (dbError) {
            console.error('Login DB lookup failed:', dbError);
        }

        if (!user && process.env.NODE_ENV !== 'production' && !process.env.DATABASE_URL) {
            user = {
                id: `dev-${email.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                name: email.split('@')[0] || 'Dev User',
                email: email.toLowerCase(),
                role: 'user',
                password: password,
                isVerified: true,
            };
        }

        if (!user) {
            return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
        }

        const passwordMatches = user.password.startsWith('$2')
            ? await bcrypt.compare(password, user.password)
            : password === user.password;

        if (!user.password || !passwordMatches) {
            return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
        }

        if (!user.isVerified) {
            return NextResponse.json({ success: false, message: 'Please verify your email to login' }, { status: 403 });
        }


        const token = await signToken({
            id: user.id,
            email: user.email,
            role: user.role,
        });

        const response = NextResponse.json({
            success: true,
            message: 'Logged in successfully',
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
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
