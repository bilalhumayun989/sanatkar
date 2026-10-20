import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';

export async function PUT(request: NextRequest) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || profile?.role !== 'admin') return NextResponse.json({ success: false, message: 'Admin access required.' }, { status: 403 });
  const body: unknown = await request.json();
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, message: 'Invalid ad data.' }, { status: 400 });
  const input = body as Record<string, unknown>;
  const data: {
    title?: string; description?: string; buttonText?: string; buttonLink?: string;
    imageUrl?: string; badgeText?: string; isActive?: boolean;
  } = {};
  const fields = [
    ['title', 'title', 180],
    ['description', 'description', 1200],
    ['buttonText', 'buttonText', 80],
    ['buttonLink', 'buttonLink', 500],
    ['imageUrl', 'imageUrl', 2048],
    ['badgeText', 'badgeText', 60],
  ] as const;
  for (const [source, target, max] of fields) {
    if (typeof input[source] === 'string') data[target] = input[source].trim().slice(0, max);
  }
  if (typeof input.isActive === 'boolean') data.isActive = input.isActive;
  try {
    const current = await prisma.ad.findFirst({ orderBy: { createdAt: 'asc' } });
    const ad = current
      ? await prisma.ad.update({ where: { id: current.id }, data })
      : await prisma.ad.create({ data });
    return NextResponse.json({ success: true, ad });
  } catch (error) {
    console.error('Ad configuration update failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to save ad configuration.' }, { status: 500 });
  }
}
