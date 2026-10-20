import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';

export async function POST(request: NextRequest) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || !profile) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (profile.role !== 'seller') return NextResponse.json({ message: 'You must become a seller before requesting verification.' }, { status: 403 });

  const body: unknown = await request.json();
  const proofUrl = body && typeof body === 'object' && 'proofUrl' in body && typeof body.proofUrl === 'string'
    ? body.proofUrl.trim()
    : '';
  if (!proofUrl || proofUrl.length > 2048 || (!proofUrl.startsWith('/') && !/^https:\/\//i.test(proofUrl))) {
    return NextResponse.json({ message: 'A valid payment proof path is required.' }, { status: 400 });
  }
  if (profile.verificationStatus === 'approved') return NextResponse.json({ message: 'Your seller badge is already verified.' }, { status: 409 });
  if (profile.verificationStatus === 'pending') return NextResponse.json({ message: 'Your verification request is already under review.' }, { status: 409 });

  try {
    const result = await prisma.profile.updateMany({
      where: { id: user.id, role: 'seller', OR: [{ verificationStatus: null }, { verificationStatus: { notIn: ['pending', 'approved'] } }] },
      data: {
        verificationStatus: 'pending',
        verificationProofUrl: proofUrl,
        verificationRequestedAt: new Date(),
        verificationReviewedAt: null,
      },
    });
    if (!result.count) return NextResponse.json({ message: 'Verification request is already pending or approved.' }, { status: 409 });
    return NextResponse.json({ success: true, status: 'pending' });
  } catch (error) {
    console.error('Seller verification request failed:', error);
    return NextResponse.json({ message: 'Could not submit verification request.' }, { status: 500 });
  }
}
