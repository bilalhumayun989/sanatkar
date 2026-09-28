import { NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { verifyToken } from '@/lib/auth';

export async function PUT(request: Request) {
    try {
        const authCookie = request.headers.get('cookie')?.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1];
        if (!authCookie) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyToken(authCookie);
        if (!payload) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        // await dbConnect();
        
        const body = await request.json();
        const { title, description, buttonText, buttonLink, imageUrl, badgeText, isActive } = body;

        // Try to find the existing config, else create a new one
        let adContent = await prisma.ad.findFirst();

        if (adContent) {
            adContent = await prisma.ad.update({
                where: { id: adContent.id },
                data: {
                    title: title ?? adContent.title,
                    description: description ?? adContent.description,
                    buttonText: buttonText ?? adContent.buttonText,
                    buttonLink: buttonLink ?? adContent.buttonLink,
                    imageUrl: imageUrl ?? adContent.imageUrl,
                    badgeText: badgeText ?? adContent.badgeText,
                    isActive: isActive !== undefined ? isActive : adContent.isActive
                }
            });
        } else {
             adContent = await prisma.ad.create({
                 data: { title, description, buttonText, buttonLink, imageUrl, badgeText, isActive }
             });
        }

        return NextResponse.json({ success: true, ad: adContent });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
    }
}
