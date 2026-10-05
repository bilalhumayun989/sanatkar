import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { ArrowLeft, ArrowUpRight, BookOpen, CalendarDays, Clock3 } from 'lucide-react';
import { getPublishedBlog, getPublishedBlogs } from '@/lib/blog-server';
import { blogDate, readingTime } from '@/lib/blog';
import BlogContent from '@/app/components/blog/BlogContent';
import BlogCover from '@/app/components/blog/BlogCover';
import BlogShare from '@/app/components/blog/BlogShare';

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
  const related = (await getPublishedBlogs()).filter(item => item.id !== post.id).sort((a, b) => Number(b.category === post.category) - Number(a.category === post.category)).slice(0, 2);
  const headings = post.content.split(/\r?\n\s*\r?\n/).filter(Boolean).flatMap((block, index) => {
    if (block.startsWith('## ')) return [{ title: block.slice(3), id: `article-section-${index}`, subheading: false }];
    if (block.startsWith('### ')) return [{ title: block.slice(4), id: `article-section-${index}`, subheading: true }];
    return [];
  });

  return <article className="pb-14 sm:pb-20">
    <header className="border-b border-slate-200/70 bg-white px-4 pb-10 pt-7 sm:px-6 sm:pb-14 sm:pt-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/blogs" className="mb-9 inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-[#0092B8]"><ArrowLeft size={15} /> Back to the journal</Link>
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-5 inline-flex rounded-full border border-[#0092B8]/15 bg-[#0092B8]/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#0084a6]">{post.category}</p>
          <h1 dir="auto" className="break-words text-3xl font-bold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">{post.title}</h1>
          <p dir="auto" className="mx-auto mt-5 max-w-3xl break-words text-base leading-7 text-slate-500 sm:mt-7 sm:text-lg sm:leading-8">{post.excerpt}</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0092B8]/10 font-bold text-[#0084a6]">{post.author_name.charAt(0)}</span><span className="font-bold text-slate-800">{post.author_name}</span></span>
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} /> {blogDate(post.created_at)}</span>
            <span className="inline-flex items-center gap-1.5"><Clock3 size={14} /> {readingTime(post.content)} min read</span>
          </div>
        </div>
        <div className="mt-9 overflow-hidden rounded-2xl border border-slate-200 sm:mt-11 sm:rounded-[28px]"><BlogCover src={post.cover_image_url} title={post.title} priority className="aspect-[4/3] sm:aspect-[16/8]" /></div>
      </div>
    </header>
    <div className="mx-auto grid max-w-6xl items-start gap-8 px-4 pt-9 sm:px-6 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-10">
      <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:rounded-3xl sm:p-10">
        <BlogContent content={post.content} />
        <div className="mt-10 border-t border-slate-100 pt-7"><p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Found this useful? Share it.</p><BlogShare title={post.title} /></div>
        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#f1f7f7] p-5"><p className="text-sm text-slate-600">Thanks for reading the Sanatkar journal.</p><Link href="/blogs" className="inline-flex items-center gap-1 text-sm font-bold text-[#0084a6]">All articles <ArrowUpRight size={16} /></Link></div>
      </div>
      <aside className="min-w-0 space-y-5 lg:sticky lg:top-24">
        {headings.length > 0 && <nav aria-label="Article contents" className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="mb-5 text-xs font-bold uppercase tracking-widest text-slate-400">In this article</h2><ol className="space-y-3">{headings.map(heading => <li key={heading.id} className={heading.subheading ? 'ps-3' : ''}><a href={`#${heading.id}`} dir="auto" className="block break-words text-sm font-medium leading-6 text-slate-600 transition hover:text-[#0092B8]">{heading.title}</a></li>)}</ol></nav>}
        <div className="rounded-2xl bg-[#12343a] p-6 text-white"><BookOpen className="mb-5 text-[#73e3e2]" size={25} strokeWidth={1.5} /><h2 className="text-lg font-bold">A little insight.<br />A better next step.</h2><p className="mt-3 text-sm leading-6 text-white/65">Discover more practical guides and stories from the Sanatkar community.</p><Link href="/blogs" className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#73e3e2]">Explore the journal <ArrowUpRight size={15} /></Link></div>
      </aside>
    </div>
    {related.length > 0 && <section className="mx-auto mt-12 max-w-6xl px-4 sm:mt-16 sm:px-6"><div className="mb-6 flex items-end justify-between gap-3"><div><p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#0084a6]">Your next read</p><h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Keep exploring</h2></div><Link href="/blogs" className="shrink-0 text-xs font-bold text-[#0084a6]">View all</Link></div><div className="grid gap-6 md:grid-cols-2">{related.map(item => <Link key={item.id} href={`/blogs/${item.slug}`} className="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><BlogCover src={item.cover_image_url} title={item.title} className="aspect-[16/9] border-b border-slate-100" /><div className="min-w-0 p-6 sm:p-7"><p className="text-[11px] font-bold uppercase tracking-widest text-[#0084a6]">{item.category}</p><h3 dir="auto" className="mt-3 break-words text-xl font-bold leading-snug group-hover:text-[#0084a6]">{item.title}</h3><p dir="auto" className="mt-3 line-clamp-2 break-words text-sm leading-7 text-slate-500">{item.excerpt}</p><span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-[#0084a6]">Read story <ArrowUpRight size={16} /></span></div></Link>)}</div></section>}
  </article>;
}
