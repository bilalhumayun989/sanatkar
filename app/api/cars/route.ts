import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';

export async function GET() {
  const cars = await prisma.car.findMany({ where: { status: 'available' }, include: { seller: { select: { name: true, role: true } } }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(cars);
}

export async function POST(request: NextRequest) {
  try {
    const { user, profile } = await getCurrentProfile(request);
    if (!user || !profile) return NextResponse.json({ message: 'Please log in to post a listing.' }, { status: 401 });
    if (profile.role === 'regular' && await prisma.car.count({ where: { sellerId: user.id } }) >= 3) {
      return NextResponse.json({ code: 'AD_LIMIT_REACHED', message: 'You have reached the 3-ad limit. Upgrade to a seller account to post more ads.' }, { status: 403 });
    }
    const { make, model, year, price, description, condition, mileage, location, images, fuelType, transmission, category } = await request.json();
    if (!make || !model || !year || !price || !description || !condition || !location) return NextResponse.json({ message: 'Missing required listing fields.' }, { status: 400 });
    const car = await prisma.car.create({ data: { make, model, year: Number(year), price: Number(price), description, condition, mileage: Number(mileage) || 0, location, images: images || [], fuelType: fuelType || '', transmission: transmission || '', category: category || '', sellerId: user.id, isFeatured: profile.role === 'admin' } });
    return NextResponse.json(car, { status: 201 });
  } catch (error) {
    console.error('Create listing error:', error);
    return NextResponse.json({ message: 'Failed to create listing.' }, { status: 500 });
  }
}
