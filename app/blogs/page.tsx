import type { Metadata } from 'next';
import { getPublishedBlogs } from '@/lib/blog-server';
import BlogListing from '@/app/components/blog/BlogListing';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'The Sanatkar Journal | Guides, Ideas & Stories', description: 'Explore buying guides, maintenance advice, and stories from the Sanatkar marketplace.' };

export default async function BlogsPage() {
  const posts = await getPublishedBlogs();
  return <BlogListing posts={posts} />;
}
