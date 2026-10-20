import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';

async function isAdmin(request: NextRequest) {
  const { user, profile } = await getCurrentProfile(request);
  return Boolean(user && profile?.role === 'admin');
}

export async function GET(request: NextRequest) {
  if (!await isAdmin(request)) return NextResponse.json({ success: false, message: 'Admin access required.' }, { status: 403 });
  try {
    const users = await prisma.profile.findMany({
      where: { role: 'regular', sellerStatus: 'approved' },
      select: { id: true, username: true, email: true, fullName: true, cnic: true, role: true },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ success: true, usersNeedingUpdate: users, count: users.length });
  } catch (error) {
    console.error('Seller role audit failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to load approved seller applications.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!await isAdmin(request)) return NextResponse.json({ success: false, message: 'Admin access required.' }, { status: 403 });
  const body: unknown = await request.json();
  const userIds = body && typeof body === 'object' && 'userIds' in body ? (body as { userIds?: unknown }).userIds : null;
  if (!Array.isArray(userIds) || !userIds.length || userIds.length > 100 || userIds.some(id => typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id))) {
    return NextResponse.json({ success: false, message: 'A list of valid user IDs is required.' }, { status: 400 });
  }
  try {
    const result = await prisma.profile.updateMany({
      where: { id: { in: userIds as string[] }, role: 'regular', sellerStatus: 'approved' },
      data: { role: 'seller' },
    });
    return NextResponse.json({ success: true, updatedCount: result.count });
  } catch (error) {
    console.error('Approved seller role update failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to update seller roles.' }, { status: 500 });
  }
}
