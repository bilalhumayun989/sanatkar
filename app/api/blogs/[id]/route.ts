import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Context) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || profile?.role !== 'admin') return NextResponse.json({ success: false, message: 'Admin access required.' }, { status: 403 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ success: false, message: 'Invalid blog id.' }, { status: 400 });
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ success: false, message: 'Invalid blog payload.' }, { status: 400 });
  }

  const title = String((body as Record<string, unknown>).title ?? '').trim();
  const slug = String((body as Record<string, unknown>).slug ?? '').trim();
  if (!title || !slug) return NextResponse.json({ success: false, message: 'Title and slug are required.' }, { status: 400 });

  try {
    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        title,
        slug,
        excerpt: String((body as Record<string, unknown>).excerpt ?? '').trim(),
        content: String((body as Record<string, unknown>).content ?? '').trim(),
        category: String((body as Record<string, unknown>).category ?? 'Guides').trim(),
        authorName: String((body as Record<string, unknown>).author_name ?? 'Sanatkar Editorial').trim(),
        coverImageUrl: String((body as Record<string, unknown>).cover_image_url ?? '').trim(),
        status: (body as Record<string, unknown>).status === 'published' ? 'published' : 'draft',
      },
    });
    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error('Blog detail update failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to update article.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || profile?.role !== 'admin') return NextResponse.json({ success: false, message: 'Admin access required.' }, { status: 403 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ success: false, message: 'Invalid blog id.' }, { status: 400 });
  try {
    await prisma.blogPost.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Blog delete failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to delete article.' }, { status: 500 });
  }
}
