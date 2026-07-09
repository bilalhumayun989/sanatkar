import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const car = await prisma.car.findUnique({ where: { id: params.id } });
        if (!car) {
            return NextResponse.json({ message: 'Car not found' }, { status: 404 });
        }
        return NextResponse.json(car, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const token = req.cookies.get('auth_token')?.value;
        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        const decoded: any = await verifyToken(token);
        if (!decoded || !decoded.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const params = await props.params;

        // Ensure car exists
        const existingCar = await prisma.car.findUnique({ where: { id: params.id } });
        if (!existingCar) {
            return NextResponse.json({ message: 'Car not found' }, { status: 404 });
        }

        // Only allow updating relevant fields
        const { make, model, year, price, description, condition, mileage, location, images, status, isFeatured, fuelType, transmission, category } = body;

        const updatedCar = await prisma.car.update({
            where: { id: params.id },
            data: {
                ...(make !== undefined && { make }),
                ...(model !== undefined && { model }),
                ...(year !== undefined && { year: Number(year) }),
                ...(price !== undefined && { price: Number(price) }),
                ...(description !== undefined && { description }),
                ...(condition !== undefined && { condition }),
                ...(mileage !== undefined && { mileage: Number(mileage) }),
                ...(location !== undefined && { location }),
                ...(images !== undefined && { images }),
                ...(status !== undefined && { status }),
                ...(isFeatured !== undefined && { isFeatured }),
                ...(fuelType !== undefined && { fuelType }),
                ...(transmission !== undefined && { transmission }),
                ...(category !== undefined && { category }),
            },
        });

        return NextResponse.json(updatedCar, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
