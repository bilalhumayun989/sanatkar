import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentUser } from '@/lib/auth/supabase/server';
export async function GET(request: NextRequest) {
  const { user } = await getCurrentUser(request);
  if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ success: true, products: await prisma.car.findMany({ where: { sellerId: user.id }, orderBy: { createdAt: 'desc' } }) });
}
