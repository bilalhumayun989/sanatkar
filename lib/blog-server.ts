import 'server-only';
import prisma from '@/lib/dbConn';
import type { BlogPost } from '@/lib/blog';

function mapBlogPost(row: {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  authorName: string;
  coverImageUrl: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    category: row.category,
    author_name: row.authorName,
    cover_image_url: row.coverImageUrl,
    status: row.status === 'published' ? 'published' : 'draft',
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export async function getPublishedBlogs(): Promise<BlogPost[]> {
  const rows = await prisma.blogPost.findMany({
    where: { status: 'published' },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(mapBlogPost);
}

export async function getPublishedBlog(slug: string): Promise<BlogPost | null> {
  const row = await prisma.blogPost.findFirst({
    where: { slug, status: 'published' },
  });
  return row ? mapBlogPost(row) : null;
}
