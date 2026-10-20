import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    return NextResponse.json({ success: true, brands: brands.map(brand => ({
      id: brand.id,
      name: brand.name,
      logo_url: brand.logoUrl,
      description: brand.description,
      is_active: brand.isActive,
    })) });
  } catch (error) {
    console.error('Brands query failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to load brands.', brands: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, profile } = await getCurrentProfile(request);
    if (!user || profile?.role !== 'admin') return NextResponse.json({ success: false, message: 'Admin access required.' }, { status: 403 });
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, message: 'Invalid brand.' }, { status: 400 });
    const input = body as Record<string, unknown>;
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    if (!name || name.length > 100) return NextResponse.json({ success: false, message: 'Brand name is required.' }, { status: 400 });
    const exists = await prisma.brand.findFirst({ where: { name: { equals: name, mode: 'insensitive' } }, select: { id: true } });
    if (exists) return NextResponse.json({ success: false, message: 'Brand already exists.' }, { status: 409 });
    const logoUrl = typeof input.logo_url === 'string' ? input.logo_url.trim() : '';
    const description = typeof input.description === 'string' ? input.description.trim() : '';
    const isLocalImage = /^\/uploads\/[A-Za-z0-9._/-]+$/.test(logoUrl) && !logoUrl.split('/').includes('..');
    if (logoUrl.length > 2048 || (logoUrl && !isLocalImage && !/^https:\/\//i.test(logoUrl))) {
      return NextResponse.json({ success: false, message: 'Use a valid HTTPS logo URL or local /uploads/ path.' }, { status: 400 });
    }
    if (description.length > 1000) return NextResponse.json({ success: false, message: 'Description must be 1000 characters or fewer.' }, { status: 400 });
    const brand = await prisma.brand.create({ data: {
      name,
      logoUrl,
      description,
      isActive: typeof input.is_active === 'boolean' ? input.is_active : true,
    } });
    return NextResponse.json({ success: true, brand }, { status: 201 });
  } catch (error) {
    console.error('Brand create failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to create brand.' }, { status: 500 });
  }
}
