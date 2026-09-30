import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getCurrentProfile } from '@/lib/auth/supabase/server';

export async function POST(request: NextRequest) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || !profile) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (profile.role !== 'seller') {
    return NextResponse.json({ message: 'You must become a seller before requesting verification.' }, { status: 403 });
  }

  const body = await request.json();
  const proofUrl = String(body.proofUrl || '').trim();
  if (!proofUrl) return NextResponse.json({ message: 'Payment proof is required.' }, { status: 400 });
  if (profile.verification_status === 'approved') {
    return NextResponse.json({ message: 'Your seller badge is already verified.' }, { status: 409 });
  }
  if (profile.verification_status === 'pending') {
    return NextResponse.json({ message: 'Your verification request is already under review.' }, { status: 409 });
  }

  const { error } = await createAdminClient()
    .from('profiles')
    .update({
      verification_status: 'pending',
      verification_proof_url: proofUrl,
      verification_requested_at: new Date().toISOString(),
      verification_reviewed_at: null,
    })
    .eq('id', user.id)
    .eq('role', 'seller');

  if (error) return NextResponse.json({ message: 'Could not submit verification request.' }, { status: 500 });
  return NextResponse.json({ success: true, status: 'pending' });
}
