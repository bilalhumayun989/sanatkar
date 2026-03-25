import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConn';
import User from '@/lib/models/User';
import { verifyToken } from '@/lib/auth';

async function verifyAdmin(req: NextRequest) {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) return null;
    const decoded: any = await verifyToken(token);
    if (!decoded || decoded.role !== 'admin') return null;
    return decoded;
}

export async function GET(req: NextRequest) {
    try {
        const admin = await verifyAdmin(req);
        if (!admin) {
            return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
        }
        await dbConnect();
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        return NextResponse.json({ success: true, users });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// DELETE a user by ID
export async function DELETE(req: NextRequest) {
    try {
        const admin = await verifyAdmin(req);
        if (!admin) {
            return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
        }
        const { id } = await req.json();
        await dbConnect();
        await User.findByIdAndDelete(id);
        return NextResponse.json({ success: true, message: 'User deleted' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
