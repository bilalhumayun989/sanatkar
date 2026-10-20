export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author_name: string;
  cover_image_url: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export type BlogInput = Pick<BlogPost, 'slug' | 'title' | 'excerpt' | 'content' | 'category' | 'author_name' | 'cover_image_url' | 'status'>;

export function blogSlug(title: string) {
  return title.toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 160).replace(/-$/g, '');
}

export function readingTime(content: string) {
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200));
}

export function blogDate(date: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(date));
}

export function validateBlog(post: BlogInput): string | null {
  for (const [key, limit] of Object.entries({ title: 180, slug: 160, excerpt: 320, content: 60000, category: 60, author_name: 100 })) {
    const value = post[key as keyof BlogInput];
    if (!value.trim()) return `Please enter ${key.replace('_', ' ')}.`;
    if (value.length > limit) return `${key.replace('_', ' ')} must be ${limit} characters or fewer.`;
  }
  if (blogSlug(post.slug) !== post.slug) return 'Use letters, numbers, and hyphens for the URL slug.';
  if (!['draft', 'published'].includes(post.status)) return 'Choose draft or published.';
  if (post.cover_image_url) {
    const isLocalUpload = /^\/uploads\/[A-Za-z0-9._/-]+$/.test(post.cover_image_url)
      && !post.cover_image_url.split('/').includes('..');
    if (!isLocalUpload) {
      try {
        const url = new URL(post.cover_image_url);
        if (url.protocol !== 'https:') return 'Use an HTTPS cover image URL or a local /uploads/ path.';
      } catch { return 'Enter a valid HTTPS image URL or a local /uploads/ path.'; }
    }
  }
  return null;
}
