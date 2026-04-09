import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConn';
import Car from '@/lib/models/Car';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const params = await props.params;
        const car = await Car.findById(params.id);
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
        await dbConnect();

        // Optional: you can restrict editing to owner or admin.
        // For now, let's just make sure they're logged in.
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
        
        // Find existing car to ensure it exists
        const existingCar = await Car.findById(params.id);
        if (!existingCar) {
            return NextResponse.json({ message: 'Car not found' }, { status: 404 });
        }
        
        // Optionally map body back to schema
        // The frontend sends make, model, year, etc.
        const updatedCar = await Car.findByIdAndUpdate(
            params.id,
            { ...body },
            { new: true, runValidators: true }
        );

        return NextResponse.json(updatedCar, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
