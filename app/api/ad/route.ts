import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConn';
import Ad from '@/lib/models/Ad';

export async function GET() {
    try {
        await dbConnect();
        
        // We only maintain one primary Ad configuration in the database for now
        let adContent = await Ad.findOne();

        // If no ad exists, trigger creation with default values
        if (!adContent) {
            adContent = await Ad.create({});
        }

        return NextResponse.json({ success: true, ad: adContent });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
    }
}
