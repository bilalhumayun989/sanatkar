import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConn';
import Category from '@/lib/models/Category';

export async function PATCH(req: Request, { params }: { params: any }) {
    try {
        await dbConnect();
        const { id } = await params;
        const { isPopular } = await req.json();

        const category = await Category.findByIdAndUpdate(id, { isPopular }, { returnDocument: 'after' });
        if (!category) {
            return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, category });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
