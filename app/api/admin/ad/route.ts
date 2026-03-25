import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConn';
import Ad from '@/lib/models/Ad';
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

        await dbConnect();
        
        const body = await request.json();
        const { title, description, buttonText, buttonLink, imageUrl, badgeText, isActive } = body;

        // Try to find the existing config, else create a new one
        let adContent = await Ad.findOne();

        if (adContent) {
            adContent.title = title ?? adContent.title;
            adContent.description = description ?? adContent.description;
            adContent.buttonText = buttonText ?? adContent.buttonText;
            adContent.buttonLink = buttonLink ?? adContent.buttonLink;
            adContent.imageUrl = imageUrl ?? adContent.imageUrl;
            adContent.badgeText = badgeText ?? adContent.badgeText;
            adContent.isActive = isActive !== undefined ? isActive : adContent.isActive;
            
            await adContent.save();
        } else {
             adContent = await Ad.create({
                 title, description, buttonText, buttonLink, imageUrl, badgeText, isActive
             });
        }

        return NextResponse.json({ success: true, ad: adContent });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
    }
}
