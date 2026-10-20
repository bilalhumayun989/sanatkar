import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';

type Context = { params: Promise<{ id: string }> };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function requireAdmin(request: NextRequest) {
  const { user, profile } = await getCurrentProfile(request);
  return user && profile?.role === 'admin';
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!uuidPattern.test(id)) return NextResponse.json({ success: false, message: 'Category not found.' }, { status: 404 });
  try {
    if (!await requireAdmin(request)) return NextResponse.json({ success: false, message: 'Admin access required.' }, { status: 403 });
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, message: 'Invalid category.' }, { status: 400 });
    const input = body as Record<string, unknown>;
    const data: { name?: string; iconCode?: number; description?: string; imageUrl?: string; isActive?: boolean; isPopular?: boolean } = {};
    if (typeof input.name === 'string') {
      const name = input.name.trim();
      if (!name || name.length > 100) return NextResponse.json({ success: false, message: 'Category name is invalid.' }, { status: 400 });
      const duplicate = await prisma.category.findFirst({
        where: { id: { not: id }, name: { equals: name, mode: 'insensitive' } },
        select: { id: true },
      });
      if (duplicate) return NextResponse.json({ success: false, message: 'A category with that name already exists.' }, { status: 409 });
      data.name = name;
    }
    if (input.icon_code !== undefined) {
      const value = Number(input.icon_code);
      if (!Number.isSafeInteger(value)) return NextResponse.json({ success: false, message: 'Invalid icon code.' }, { status: 400 });
      data.iconCode = value;
    }
    if (typeof input.description === 'string') {
      const description = input.description.trim();
      if (description.length > 1000) return NextResponse.json({ success: false, message: 'Description must be 1000 characters or fewer.' }, { status: 400 });
      data.description = description;
    }
    if (typeof input.image_url === 'string') {
      const imageUrl = input.image_url.trim();
      const isLocalImage = /^\/uploads\/[A-Za-z0-9._/-]+$/.test(imageUrl) && !imageUrl.split('/').includes('..');
      if (imageUrl.length > 2048 || (imageUrl && !isLocalImage && !/^https:\/\//i.test(imageUrl))) {
        return NextResponse.json({ success: false, message: 'Use a valid HTTPS image URL or local /uploads/ path.' }, { status: 400 });
      }
      data.imageUrl = imageUrl;
    }
    if (typeof input.is_active === 'boolean') data.isActive = input.is_active;
    if (typeof input.is_popular === 'boolean') data.isPopular = input.is_popular;
    if (!Object.keys(data).length) return NextResponse.json({ success: false, message: 'No supported changes.' }, { status: 400 });
    const category = await prisma.category.update({ where: { id }, data });
    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error('Category update failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to update category.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!uuidPattern.test(id)) return NextResponse.json({ success: false, message: 'Category not found.' }, { status: 404 });
  try {
    if (!await requireAdmin(request)) return NextResponse.json({ success: false, message: 'Admin access required.' }, { status: 403 });
    await prisma.category.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Category archive failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to archive category.' }, { status: 404 });
  }
}
