import { NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';

export async function PATCH(req: Request, { params }: { params: any }) {
    try {
        // await dbConnect();
        const { id } = await params;
        const { isPopular } = await req.json();

        try {
            const category = await prisma.category.update({
                where: { id },
                data: { isPopular }
            });
            return NextResponse.json({ success: true, category });
        } catch (updateError) {
            return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
