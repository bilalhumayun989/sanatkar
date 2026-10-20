import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';

function toCategory(category: {
  id: string; name: string; iconCode: number | null; imageUrl: string | null;
  description: string | null; isActive: boolean | null; isPopular: boolean;
}) {
  return {
    id: category.id,
    name: category.name,
    slug: category.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    icon_code: category.iconCode,
    image_url: category.imageUrl,
    description: category.description,
    is_active: category.isActive,
    is_popular: category.isPopular,
  };
}

export async function GET() {
  try {
    const rows = await prisma.category.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    const categories = rows.map(toCategory);
    return NextResponse.json({ success: true, categories, count: categories.length });
  } catch (error) {
    console.error('Categories query failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to load categories.', categories: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, profile } = await getCurrentProfile(request);
    if (!user || profile?.role !== 'admin') return NextResponse.json({ success: false, message: 'Admin access required.' }, { status: 403 });
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, message: 'Invalid category.' }, { status: 400 });
    const input = body as Record<string, unknown>;
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    if (!name || name.length > 100) return NextResponse.json({ success: false, message: 'Category name is required.' }, { status: 400 });
    const exists = await prisma.category.findFirst({ where: { name: { equals: name, mode: 'insensitive' } }, select: { id: true } });
    if (exists) return NextResponse.json({ success: false, message: 'A category with that name already exists.' }, { status: 409 });
    const iconCode = input.icon_code === undefined ? 58345 : Number(input.icon_code);
    if (!Number.isSafeInteger(iconCode)) return NextResponse.json({ success: false, message: 'Icon code must be an integer.' }, { status: 400 });
    const description = typeof input.description === 'string' ? input.description.trim() : '';
    const imageUrl = typeof input.image_url === 'string' ? input.image_url.trim() : '';
    const isLocalImage = /^\/uploads\/[A-Za-z0-9._/-]+$/.test(imageUrl) && !imageUrl.split('/').includes('..');
    if (description.length > 1000 || imageUrl.length > 2048 || (imageUrl && !isLocalImage && !/^https:\/\//i.test(imageUrl))) {
      return NextResponse.json({ success: false, message: 'Category description or image URL is invalid.' }, { status: 400 });
    }
    const category = await prisma.category.create({ data: {
      name,
      iconCode,
      description,
      imageUrl,
      isActive: typeof input.is_active === 'boolean' ? input.is_active : true,
      isPopular: typeof input.is_popular === 'boolean' ? input.is_popular : false,
    } });
    return NextResponse.json({ success: true, category: toCategory(category) }, { status: 201 });
  } catch (error) {
    console.error('Category create failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to create category.' }, { status: 500 });
  }
}
