import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';

type Context = { params: Promise<{ id: string }> };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function isAdmin(request: NextRequest) {
  const { user, profile } = await getCurrentProfile(request);
  return Boolean(user && profile?.role === 'admin');
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!uuidPattern.test(id)) return NextResponse.json({ success: false, message: 'Brand not found.' }, { status: 404 });
  try {
    if (!await isAdmin(request)) return NextResponse.json({ success: false, message: 'Admin access required.' }, { status: 403 });
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, message: 'Invalid brand.' }, { status: 400 });
    const input = body as Record<string, unknown>;
    const data: { name?: string; logoUrl?: string; description?: string; isActive?: boolean } = {};
    if (typeof input.name === 'string') {
      const name = input.name.trim();
      if (!name || name.length > 100) return NextResponse.json({ success: false, message: 'Brand name is invalid.' }, { status: 400 });
      const duplicate = await prisma.brand.findFirst({
        where: { id: { not: id }, name: { equals: name, mode: 'insensitive' } },
        select: { id: true },
      });
      if (duplicate) return NextResponse.json({ success: false, message: 'Brand already exists.' }, { status: 409 });
      data.name = name;
    }
    if (typeof input.logo_url === 'string') {
      const logoUrl = input.logo_url.trim();
      const isLocalImage = /^\/uploads\/[A-Za-z0-9._/-]+$/.test(logoUrl) && !logoUrl.split('/').includes('..');
      if (logoUrl.length > 2048 || (logoUrl && !isLocalImage && !/^https:\/\//i.test(logoUrl))) {
        return NextResponse.json({ success: false, message: 'Use a valid HTTPS logo URL or local /uploads/ path.' }, { status: 400 });
      }
      data.logoUrl = logoUrl;
    }
    if (typeof input.description === 'string') {
      const description = input.description.trim();
      if (description.length > 1000) return NextResponse.json({ success: false, message: 'Description must be 1000 characters or fewer.' }, { status: 400 });
      data.description = description;
    }
    if (typeof input.is_active === 'boolean') data.isActive = input.is_active;
    if (!Object.keys(data).length) return NextResponse.json({ success: false, message: 'No supported changes.' }, { status: 400 });
    const brand = await prisma.brand.update({ where: { id }, data });
    return NextResponse.json({ success: true, brand });
  } catch (error) {
    console.error('Brand update failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to update brand.' }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!uuidPattern.test(id)) return NextResponse.json({ success: false, message: 'Brand not found.' }, { status: 404 });
  try {
    if (!await isAdmin(request)) return NextResponse.json({ success: false, message: 'Admin access required.' }, { status: 403 });
    await prisma.brand.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Brand archive failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to archive brand.' }, { status: 404 });
  }
}
