import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { getPublishedBlog, getPublishedBlogs } from '@/lib/blog-server';
import { blogDate, readingTime } from '@/lib/blog';
import BlogContent from '@/app/components/blog/BlogContent';
import BlogCover from '@/app/components/blog/BlogCover';

export const dynamic = 'force-dynamic';
const getPost = cache(getPublishedBlog);
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return { title: 'Article not found | Sanatkar' };
  return { title: `${post.title} | Sanatkar Journal`, description: post.excerpt, openGraph: { title: post.title, description: post.excerpt, type: 'article', publishedTime: post.created_at, modifiedTime: post.updated_at, authors: [post.author_name], ...(post.cover_image_url ? { images: [post.cover_image_url] } : {}) } };
}

export default async function BlogPage({ params }: Props) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  const related = (await getPublishedBlogs()).filter(item => item.id !== post.id).sort((a, b) => Number(b.category === post.category) - Number(a.category === post.category)).slice(0, 3);
  return <article className="mx-auto max-w-6xl px-5 py-10 sm:py-16">
    <Link href="/blogs" className="mb-10 inline-flex items-center gap-2 text-sm font-bold text-teal-700"><ArrowLeft size={16} /> Back to the journal</Link>
    <header className="mx-auto mb-10 max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">{post.category}</p><h1 dir="auto" className="mt-5 break-words text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">{post.title}</h1><p dir="auto" className="mt-6 text-xl leading-8 text-slate-500">{post.excerpt}</p><div className="mt-7 flex flex-wrap items-center gap-3 text-sm text-slate-500"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 font-bold text-teal-800">{post.author_name.charAt(0)}</span><span className="font-bold text-slate-800">{post.author_name}</span><span>· {blogDate(post.created_at)} · {readingTime(post.content)} min read</span></div></header>
    <BlogCover src={post.cover_image_url} title={post.title} className="mb-12 aspect-[16/9] max-h-[560px] rounded-3xl" />
    <div className="mx-auto max-w-3xl"><BlogContent content={post.content} /><div className="mt-12 flex items-center justify-between border-y border-slate-200 py-6"><p className="text-sm text-slate-500">Thanks for reading the Sanatkar journal.</p><Link href="/blogs" className="text-sm font-bold text-teal-700">All articles →</Link></div></div>
    {related.length > 0 && <section className="mt-16"><h2 className="mb-6 text-2xl font-bold">Keep exploring</h2><div className="grid gap-6 sm:grid-cols-3">{related.map(item => <Link key={item.id} href={`/blogs/${item.slug}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white"><BlogCover src={item.cover_image_url} title={item.title} className="aspect-[16/10]" /><div className="p-5"><p className="text-xs font-bold text-teal-700">{item.category}</p><h3 className="mt-2 text-lg font-bold">{item.title}</h3><span className="mt-4 inline-flex items-center gap-1 text-sm text-teal-700">Read story <ArrowUpRight size={16} /></span></div></Link>)}</div></section>}
  </article>;
}
