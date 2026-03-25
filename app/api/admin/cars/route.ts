import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConn';
import Car from '@/lib/models/Car';
import { verifyToken } from '@/lib/auth';

async function verifyAdmin(req: NextRequest) {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) return null;
    const decoded: any = await verifyToken(token);
    if (!decoded || decoded.role !== 'admin') return null;
    return decoded;
}

// GET all cars (all statuses) for admin
export async function GET(req: NextRequest) {
    try {
        const admin = await verifyAdmin(req);
        if (!admin) {
            return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
        }
        await dbConnect();
        const cars = await Car.find({}).populate('seller', 'name email').sort({ createdAt: -1 });
        return NextResponse.json({ success: true, cars });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// DELETE a car by ID
export async function DELETE(req: NextRequest) {
    try {
        const admin = await verifyAdmin(req);
        if (!admin) {
            return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
        }
        const { id } = await req.json();
        await dbConnect();
        await Car.findByIdAndDelete(id);
        return NextResponse.json({ success: true, message: 'Car deleted' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
