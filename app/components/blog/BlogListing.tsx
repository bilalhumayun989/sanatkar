'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, BookOpen, CalendarDays, Clock3, Search } from 'lucide-react';
import { blogDate, readingTime, type BlogPost } from '@/lib/blog';
import BlogCover from './BlogCover';

export default function BlogListing({ posts }: { posts: BlogPost[] }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [limit, setLimit] = useState(8);
  const categories = ['All', ...new Set(posts.map(post => post.category))];
  const filtered = posts.filter(post => (category === 'All' || post.category === category) && `${post.title} ${post.excerpt} ${post.category}`.toLowerCase().includes(search.toLowerCase()));
  const featured = filtered[0];
  const remaining = filtered.slice(1);

  return <>
    <header className="relative overflow-hidden bg-[#0b282e] px-5 py-14 text-white sm:py-20">
      <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full border-[60px] border-[#73e3e2]/10" />
      <div className="relative mx-auto max-w-6xl">
        <p className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#73e3e2]"><BookOpen size={16} /> The Sanatkar journal</p>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">Good reads.<br /><span className="text-[#73e3e2]">Better decisions.</span></h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-white/65">Ideas, practical guides, and stories for the people who build, buy, and keep things moving.</p>
      </div>
    </header>
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-2" aria-label="Filter by category">{categories.map(item => <button key={item} onClick={() => { setCategory(item); setLimit(8); }} aria-pressed={item === category} className={`rounded-full px-4 py-2.5 text-sm font-bold transition ${item === category ? 'bg-[#12343a] text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:border-teal-500'}`}>{item}</button>)}</div>
        <label className="relative block shrink-0"><Search size={18} className="absolute left-3.5 top-3.5 text-slate-400" /><span className="sr-only">Search articles</span><input value={search} onChange={event => { setSearch(event.target.value); setLimit(8); }} placeholder="Find your next read…" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 lg:w-64" /></label>
      </div>
      {featured && <Link href={`/blogs/${featured.slug}`} className="group mb-10 block min-w-0 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_8px_30px_-16px_rgba(15,23,42,0.2)] transition-shadow hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600 sm:rounded-[28px]">
        <BlogCover src={featured.cover_image_url} title={featured.title} priority className="aspect-[4/3] border-b border-slate-100 sm:aspect-[16/7]" />
        <div className="min-w-0 p-6 sm:p-9">
          <div className="mb-4 flex flex-wrap items-center gap-3"><span className="rounded-full bg-[#0092B8]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0084a6]">{featured.category}</span><span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Featured story</span></div>
          <h2 dir="auto" className="max-w-4xl break-words text-2xl font-bold leading-tight tracking-tight text-slate-900 transition-colors group-hover:text-[#0084a6] sm:text-4xl">{featured.title}</h2>
          <p dir="auto" className="mt-4 max-w-3xl break-words text-sm leading-7 text-slate-500 sm:text-base">{featured.excerpt}</p>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-5 border-t border-slate-100 pt-5">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500"><span className="inline-flex items-center gap-1.5"><CalendarDays size={14} />{blogDate(featured.created_at)}</span><span className="inline-flex items-center gap-1.5"><Clock3 size={14} />{readingTime(featured.content)} min read</span><span className="font-semibold text-slate-700">By {featured.author_name}</span></div>
            <span className="inline-flex items-center gap-2 text-sm font-bold text-[#0084a6]">Read the story <ArrowUpRight size={18} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
          </div>
        </div>
      </Link>}
      <div className="mb-6 flex items-center justify-between gap-3"><h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{featured ? 'More from the journal' : 'All articles'}</h2><span className="shrink-0 text-xs font-medium text-slate-400">{filtered.length} article{filtered.length !== 1 ? 's' : ''}</span></div>
      {filtered.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center"><BookOpen className="mx-auto mb-4 text-teal-600" size={36} /><h3 className="text-xl font-bold">{posts.length ? 'No matching stories' : 'Our next chapter is coming soon'}</h3><p className="mt-3 text-slate-500">{posts.length ? 'Try another search or category.' : 'Check back for fresh guides, ideas, and marketplace stories.'}</p>{posts.length > 0 && <button onClick={() => { setSearch(''); setCategory('All'); }} className="mt-5 font-bold text-teal-700">Clear filters</button>}</div> : <div className="grid items-stretch gap-6 md:grid-cols-2">{remaining.slice(0, limit).map(post => <Link key={post.id} href={`/blogs/${post.slug}`} className="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600">
        <BlogCover src={post.cover_image_url} title={post.title} className="aspect-[16/10] shrink-0 border-b border-slate-100" />
        <div className="flex min-w-0 flex-1 flex-col p-6 sm:p-7"><p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#0084a6]">{post.category}</p><h3 dir="auto" className="break-words text-xl font-bold leading-snug tracking-tight text-slate-900 group-hover:text-[#0084a6] sm:text-2xl">{post.title}</h3><p dir="auto" className="mt-3 line-clamp-3 break-words text-sm leading-7 text-slate-500">{post.excerpt}</p><div className="mt-auto pt-6"><div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500"><span>{blogDate(post.created_at)} · {readingTime(post.content)} min read</span><span className="inline-flex items-center gap-1 font-bold text-[#0084a6]">Read article <ArrowUpRight size={17} /></span></div></div></div>
      </Link>)}</div>}
      {featured && remaining.length === 0 && <p className="rounded-2xl border border-slate-100 bg-white p-6 text-sm text-slate-500">You’re all caught up. More stories are on the way.</p>}
      {remaining.length > limit && <div className="mt-10 text-center"><button onClick={() => setLimit(value => value + 8)} className="rounded-full bg-[#12343a] px-7 py-3 font-bold text-white">Load more articles</button></div>}
    </div>
  </>;
}
