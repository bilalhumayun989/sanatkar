import { NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';

export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            orderBy: [
                { isPopular: 'desc' },
                { name: 'asc' }
            ]
        });
        return NextResponse.json({ success: true, categories });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        // await dbConnect();
        const { name } = await req.json();

        if (!name) {
            return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
        }

        const existing = await prisma.category.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: 'insensitive'
                }
            }
        });
        if (existing) {
            return NextResponse.json({ success: false, message: 'Category already exists' }, { status: 400 });
        }

        const category = await prisma.category.create({ data: { name } });
        return NextResponse.json({ success: true, category });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
