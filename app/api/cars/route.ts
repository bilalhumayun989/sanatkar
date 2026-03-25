import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConn';
import Car from '@/lib/models/Car';
import User from '@/lib/models/User';
import { verifyToken } from '@/lib/auth';

export async function GET() {
    try {
        await dbConnect();
        const cars = await Car.find({ status: 'available' }).sort({ createdAt: -1 });
        return NextResponse.json(cars, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        
        // Only require a valid login — any authenticated user can list a car
        const token = req.cookies.get('auth_token')?.value;
        if (!token) {
            return NextResponse.json({ message: 'Please log in to post a listing' }, { status: 401 });
        }

        const decoded: any = await verifyToken(token);
        if (!decoded || !decoded.id) {
            return NextResponse.json({ message: 'Session expired, please log in again' }, { status: 401 });
        }

        const body = await req.json();
        const { make, model, year, price, description, condition, mileage, location, images } = body;

        const newCar = await Car.create({
            make,
            model,
            year,
            price,
            description,
            condition,
            mileage,
            location,
            images: images || [],
            seller: decoded.id,
        });

        return NextResponse.json(newCar, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
