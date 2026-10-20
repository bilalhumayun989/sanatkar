import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';
import { blogSlug, validateBlog, type BlogInput } from '@/lib/blog';

function normalizeInput(input: Record<string, unknown>): BlogInput {
  return {
    title: String(input.title ?? '').trim(),
    slug: String(input.slug ?? '').trim(),
    excerpt: String(input.excerpt ?? '').trim(),
    content: String(input.content ?? '').trim(),
    category: String(input.category ?? 'Guides').trim(),
    author_name: String(input.author_name ?? 'Sanatkar Editorial').trim(),
    cover_image_url: String(input.cover_image_url ?? '').trim(),
    status: input.status === 'published' ? 'published' : 'draft',
  };
}

export async function GET(request: NextRequest) {
  const { profile } = await getCurrentProfile(request);
  const showDrafts = profile?.role === 'admin' && request.nextUrl.searchParams.get('drafts') === 'true';

  try {
    const rows = await prisma.blogPost.findMany({
      where: showDrafts ? {} : { status: 'published' },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, posts: rows.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      author_name: post.authorName,
      cover_image_url: post.coverImageUrl,
      status: post.status === 'published' ? 'published' : 'draft',
      created_at: post.createdAt.toISOString(),
      updated_at: post.updatedAt.toISOString(),
    })) });
  } catch (error) {
    console.error('Blog list lookup failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to load blogs.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || profile?.role !== 'admin') return NextResponse.json({ success: false, message: 'Admin access required.' }, { status: 403 });

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ success: false, message: 'Invalid blog payload.' }, { status: 400 });
  }

  const input = normalizeInput(body as Record<string, unknown>);
  const validation = validateBlog(input);
  if (validation) return NextResponse.json({ success: false, message: validation }, { status: 400 });
  if (!input.slug) input.slug = blogSlug(input.title);

  try {
    const existing = await prisma.blogPost.findUnique({ where: { slug: input.slug } });
    if (existing) return NextResponse.json({ success: false, message: 'That URL slug is already in use.' }, { status: 409 });

    const post = await prisma.blogPost.create({
      data: {
        slug: input.slug,
        title: input.title,
        excerpt: input.excerpt,
        content: input.content,
        category: input.category,
        authorName: input.author_name,
        coverImageUrl: input.cover_image_url,
        status: input.status,
      },
    });

    return NextResponse.json({ success: true, post: { id: post.id, slug: post.slug, title: post.title, excerpt: post.excerpt, content: post.content, category: post.category, author_name: post.authorName, cover_image_url: post.coverImageUrl, status: post.status === 'published' ? 'published' : 'draft', created_at: post.createdAt.toISOString(), updated_at: post.updatedAt.toISOString() } }, { status: 201 });
  } catch (error) {
    console.error('Blog create failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to create article.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || profile?.role !== 'admin') return NextResponse.json({ success: false, message: 'Admin access required.' }, { status: 403 });

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ success: false, message: 'Invalid blog payload.' }, { status: 400 });
  }
  const input = normalizeInput(body as Record<string, unknown>);
  const validation = validateBlog(input);
  if (validation) return NextResponse.json({ success: false, message: validation }, { status: 400 });
  const id = String((body as Record<string, unknown>).id ?? '').trim();
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ success: false, message: 'A valid blog id is required.' }, { status: 400 });
  }

  try {
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, message: 'Blog not found.' }, { status: 404 });
    if (!input.slug) input.slug = existing.slug;
    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        slug: input.slug,
        title: input.title,
        excerpt: input.excerpt,
        content: input.content,
        category: input.category,
        authorName: input.author_name,
        coverImageUrl: input.cover_image_url,
        status: input.status,
      },
    });
    return NextResponse.json({ success: true, post: { id: post.id, slug: post.slug, title: post.title, excerpt: post.excerpt, content: post.content, category: post.category, author_name: post.authorName, cover_image_url: post.coverImageUrl, status: post.status === 'published' ? 'published' : 'draft', created_at: post.createdAt.toISOString(), updated_at: post.updatedAt.toISOString() } });
  } catch (error) {
    console.error('Blog update failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to update article.' }, { status: 500 });
  }
}
