import { NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';

export async function GET() {
    try {
        // await dbConnect();
        
        // We only maintain one primary Ad configuration in the database for now
        let adContent = await prisma.ad.findFirst();

        // If no ad exists, trigger creation with default values
        if (!adContent) {
            adContent = await prisma.ad.create({ data: {} });
        }

        return NextResponse.json({ success: true, ad: adContent });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
    }
}
