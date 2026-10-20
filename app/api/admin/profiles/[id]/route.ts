import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';

type Context = { params: Promise<{ id: string }> };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(request: NextRequest, { params }: Context) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || profile?.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Admin access required.' }, { status: 403 });
  }
  const { id } = await params;
  if (!uuidPattern.test(id)) return NextResponse.json({ success: false, message: 'Profile not found.' }, { status: 404 });

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ success: false, message: 'Invalid profile update.' }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  try {
    if (input.action === 'approve_seller' || input.action === 'reject_seller') {
      const result = await prisma.profile.updateMany({
        where: { id, role: 'regular', sellerStatus: 'pending' },
        data: input.action === 'approve_seller'
          ? { role: 'seller', sellerStatus: 'approved' }
          : { sellerStatus: 'rejected' },
      });
      if (!result.count) return NextResponse.json({ success: false, message: 'No pending seller request was found.' }, { status: 409 });
      return NextResponse.json({ success: true });
    }
    if (input.action === 'approve_verification' || input.action === 'reject_verification') {
      const result = await prisma.profile.updateMany({
        where: { id, role: 'seller', verificationStatus: 'pending' },
        data: {
          verificationStatus: input.action === 'approve_verification' ? 'approved' : 'rejected',
          verificationReviewedAt: new Date(),
        },
      });
      if (!result.count) return NextResponse.json({ success: false, message: 'No pending verification request was found.' }, { status: 409 });
      return NextResponse.json({ success: true });
    }
    if (input.role === 'regular' || input.role === 'seller' || input.role === 'admin') {
      if (id === user.id && input.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'You cannot remove your own admin role.' }, { status: 409 });
      }
      await prisma.profile.update({ where: { id }, data: { role: input.role } });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, message: 'Unsupported profile action.' }, { status: 400 });
  } catch (error) {
    console.error('Admin profile update failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to update profile.' }, { status: 500 });
  }
}
