import { NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';

export async function GET() {
    try {
        // Check if prisma is properly configured
        if (!process.env.DATABASE_URL) {
            console.warn('DATABASE_URL not configured, returning empty ad config');
            return NextResponse.json({ 
                success: true, 
                ad: {
                    isActive: false,
                    title: '',
                    description: '',
                    buttonText: '',
                    buttonLink: '',
                    imageUrl: '',
                    badgeText: ''
                }
            });
        }

        // We only maintain one primary Ad configuration in the database for now
        let adContent = await prisma.ad.findFirst();

        // If no ad exists, trigger creation with default values
        if (!adContent) {
            adContent = await prisma.ad.create({ data: {} });
        }

        return NextResponse.json({ success: true, ad: adContent });
    } catch (error: any) {
        console.warn('Ad API error:', error.message);
        // Return safe fallback instead of failing
        return NextResponse.json({ 
            success: true, 
            ad: {
                isActive: false,
                title: '',
                description: '',
                buttonText: '',
                buttonLink: '',
                imageUrl: '',
                badgeText: ''
            }
        });
    }
}
