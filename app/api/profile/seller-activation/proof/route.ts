import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || !profile) return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });
  const userId = request.nextUrl.searchParams.get('userId') || user.id;
  if (userId !== user.id && profile.role !== 'admin') return NextResponse.json({ message: 'Access denied.' }, { status: 403 });
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return NextResponse.json({ message: 'Not found.' }, { status: 404 });
  const target = await prisma.profile.findUnique({ where: { id: userId }, select: { sellerPaymentProofPath: true } });
  const name = target?.sellerPaymentProofPath;
  if (!name || !/^[0-9a-f-]{36}-[0-9a-f-]{36}\.(png|jpg|webp)$/i.test(name)) return NextResponse.json({ message: 'Not found.' }, { status: 404 });
  try {
    const bytes = await readFile(join(process.cwd(), 'private', 'seller-payments', name));
    const type = name.endsWith('.png') ? 'image/png' : name.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
    return new Response(bytes, { headers: { 'Content-Type': type, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Disposition': 'inline' } });
  } catch { return NextResponse.json({ message: 'Screenshot not found.' }, { status: 404 }); }
}
