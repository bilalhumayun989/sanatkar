import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';
export async function GET(request: NextRequest) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || !profile) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  const products = await prisma.listing.findMany({
    where: profile.role === 'admin' ? {} : { sellerId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ success: true, products: products.map(item => ({
    id: item.id,
    make: item.brand ?? '',
    model: item.model ?? item.title,
    year: item.year,
    price: Number(item.price),
    description: item.description ?? '',
    images: item.imageUrls,
    sellerId: item.sellerId,
    condition: item.condition ?? 'Used',
    category: item.category ?? '',
    mileage: Number(item.hours) || 0,
    location: item.location,
    status: item.status,
    isFeatured: item.isFeatured ?? false,
    createdAt: item.createdAt,
  })) });
}
