import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';
import { hasCompleteShop, sellerPaymentDetails } from '@/lib/seller-activation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const privateDir = () => join(process.cwd(), 'private', 'seller-payments');

export async function GET(request: NextRequest) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || !profile) return NextResponse.json({ success: false, message: 'Please sign in.' }, { status: 401 });
  return NextResponse.json({ success: true, status: profile.sellerActivationStatus,
    shop_complete: hasCompleteShop(profile), payment: sellerPaymentDetails(),
    proof_url: profile.sellerPaymentProofPath ? '/api/profile/seller-activation/proof' : null,
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: NextRequest) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || !profile) return NextResponse.json({ success: false, message: 'Please sign in.' }, { status: 401 });
  if (!['seller', 'professional'].includes(profile.role) || !hasCompleteShop(profile)) return NextResponse.json({ success: false, code: 'SHOP_REQUIRED', message: 'Create your shop before submitting payment.' }, { status: 403 });
  if (['pending', 'approved'].includes(profile.sellerActivationStatus)) return NextResponse.json({ success: false, message: 'Your payment is already pending review or approved.' }, { status: 409 });
  const form = await request.formData().catch(() => null);
  const file = form?.get('proof');
  if (!(file instanceof File) || file.size < 12 || file.size > 5 * 1024 * 1024) return NextResponse.json({ success: false, message: 'Attach a JPG, PNG, or WebP payment screenshot under 5 MB.' }, { status: 400 });
  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'png'
    : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? 'jpg'
    : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' ? 'webp' : null;
  if (!extension) return NextResponse.json({ success: false, message: 'The screenshot must be a JPG, PNG, or WebP image.' }, { status: 400 });
  const name = `${user.id}-${randomUUID()}.${extension}`;
  const path = join(privateDir(), name);
  try {
    await mkdir(privateDir(), { recursive: true });
    await writeFile(path, bytes, { flag: 'wx' });
    const updated = await prisma.profile.updateMany({
      where: { id: user.id, role: { in: ['seller', 'professional'] }, sellerActivationStatus: { in: ['unpaid', 'rejected'] } },
      data: { sellerActivationStatus: 'pending', sellerStatus: 'pending', sellerPaymentProofPath: name, sellerPaymentSubmittedAt: new Date(), sellerPaymentReviewedAt: null },
    });
    if (!updated.count) { await unlink(path); return NextResponse.json({ success: false, message: 'Your account changed. Refresh before trying again.' }, { status: 409 }); }
    const previous = profile.sellerPaymentProofPath;
    if (previous?.startsWith(`${user.id}-`) && /^[0-9a-f-]{36}-[0-9a-f-]{36}\.(png|jpg|webp)$/i.test(previous)) await unlink(join(privateDir(), previous)).catch(() => {});
    return NextResponse.json({ success: true, status: 'pending', message: 'Payment screenshot submitted. You can list products after admin approval.' });
  } catch {
    await unlink(path).catch(() => {});
    return NextResponse.json({ success: false, message: 'Unable to submit payment screenshot. Please retry.' }, { status: 503 });
  }
}
