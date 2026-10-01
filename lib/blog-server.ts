import 'server-only';
import { createClient } from '@/lib/auth/supabase/server';
import type { BlogPost } from '@/lib/blog';

export async function getPublishedBlogs() {
  const { data, error } = await createClient().from('blog_posts').select('*').eq('status', 'published').order('created_at', { ascending: false });
  if (error) throw new Error('Unable to load blog posts. Please try again shortly.');
  return (data || []) as BlogPost[];
}

export async function getPublishedBlog(slug: string) {
  const { data, error } = await createClient().from('blog_posts').select('*').eq('slug', slug).eq('status', 'published').maybeSingle();
  if (error) throw new Error('Unable to load this article. Please try again shortly.');
  return data as BlogPost | null;
}
