import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConn';
import Category from '@/lib/models/Category';

export async function GET() {
    try {
        await dbConnect();
        const categories = await Category.find({}).sort({ isPopular: -1, name: 1 });
        return NextResponse.json({ success: true, categories });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { name } = await req.json();

        if (!name) {
            return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
        }

        const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (existing) {
            return NextResponse.json({ success: false, message: 'Category already exists' }, { status: 400 });
        }

        const category = await Category.create({ name });
        return NextResponse.json({ success: true, category });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
