import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { verifyToken } from '@/lib/auth';

export async function GET() {
    try {
        console.log('[API] GET /api/cars - Fetching available cars');
        const cars = await prisma.car.findMany({
            where: { status: 'available' },
            include: { seller: { select: { name: true, role: true } } },
            orderBy: { createdAt: 'desc' },
        });
        console.log(`[API] GET /api/cars - Found ${cars.length} cars`);
        return NextResponse.json(cars, { status: 200 });
    } catch (error: any) {
        console.error('[API] GET /api/cars - Error:', error);
        return NextResponse.json({ message: error.message, error: 'Failed to fetch cars' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        console.log('[API] POST /api/cars - Creating new car listing');
        
        // Only require a valid login — any authenticated user can list a car
        const token = req.cookies.get('auth_token')?.value;
        if (!token) {
            console.log('[API] POST /api/cars - No auth token found');
            return NextResponse.json({ message: 'Please log in to post a listing' }, { status: 401 });
        }

        const decoded: any = await verifyToken(token);
        if (!decoded || !decoded.id) {
            console.log('[API] POST /api/cars - Invalid or expired token');
            return NextResponse.json({ message: 'Session expired, please log in again' }, { status: 401 });
        }

        console.log(`[API] POST /api/cars - User ID: ${decoded.id}`);

        // Fetch user to check role
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) {
            console.log('[API] POST /api/cars - User not found in database');
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        console.log(`[API] POST /api/cars - User role: ${user.role}`);

        // Limit check for regular users
        if (user.role === 'user') {
            const listingCount = await prisma.car.count({ where: { sellerId: user.id } });
            console.log(`[API] POST /api/cars - Current listings: ${listingCount}/3`);
            if (listingCount >= 3) {
                return NextResponse.json({
                    message: 'Regular users are limited to 3 listings. Please upgrade to a Seller account for unlimited listings.'
                }, { status: 403 });
            }
        }

        const body = await req.json();
        const { make, model, year, price, description, condition, mileage, location, images } = body;

        const newCar = await prisma.car.create({
            data: {
                make,
                model,
                year: Number(year),
                price: Number(price),
                description,
                condition,
                mileage: Number(mileage) || 0,
                location,
                images: images || [],
                sellerId: decoded.id,
                isFeatured: user.role === 'admin',
            },
        });

        console.log(`[API] POST /api/cars - Successfully created car with ID: ${newCar.id}`);
        return NextResponse.json(newCar, { status: 201 });
    } catch (error: any) {
        console.error('[API] POST /api/cars - Error:', error);
        return NextResponse.json({ message: error.message, error: 'Failed to create car listing' }, { status: 500 });
    }
}
