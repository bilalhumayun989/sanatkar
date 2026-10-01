'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, BookOpen, Search } from 'lucide-react';
import { blogDate, readingTime, type BlogPost } from '@/lib/blog';
import BlogCover from './BlogCover';

export default function BlogListing({ posts }: { posts: BlogPost[] }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [limit, setLimit] = useState(9);
  const categories = ['All', ...new Set(posts.map(post => post.category))];
  const filtered = posts.filter(post => (category === 'All' || post.category === category) && `${post.title} ${post.excerpt} ${post.category}`.toLowerCase().includes(search.toLowerCase()));
  const featured = !search && category === 'All' ? posts[0] : null;
  const remaining = filtered.filter(post => post.id !== featured?.id);

  return <>
    <header className="relative overflow-hidden bg-[#0b282e] px-5 py-16 text-white sm:py-24">
      <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full border-[60px] border-[#73e3e2]/10" />
      <div className="relative mx-auto max-w-6xl">
        <p className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#73e3e2]"><BookOpen size={16} /> The Sanatkar journal</p>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">Good reads.<br /><span className="text-[#73e3e2]">Better decisions.</span></h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-white/65">Ideas, practical guides, and stories for the people who build, buy, and keep things moving.</p>
      </div>
    </header>
    <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2" aria-label="Filter by category">{categories.map(item => <button key={item} onClick={() => { setCategory(item); setLimit(9); }} aria-pressed={item === category} className={`rounded-full px-4 py-2.5 text-sm font-bold transition ${item === category ? 'bg-[#12343a] text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-teal-500'}`}>{item}</button>)}</div>
        <label className="relative block shrink-0"><Search size={18} className="absolute left-3 top-3 text-slate-400" /><span className="sr-only">Search articles</span><input value={search} onChange={event => { setSearch(event.target.value); setLimit(9); }} placeholder="Find your next read…" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-teal-500 sm:w-64" /></label>
      </div>
      {featured && <Link href={`/blogs/${featured.slug}`} className="group mb-14 grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg md:grid-cols-2">
        <BlogCover src={featured.cover_image_url} title={featured.title} className="aspect-[4/3] h-full" />
        <div className="flex flex-col justify-center p-7 sm:p-10"><p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-teal-700">Latest story · {featured.category}</p><h2 dir="auto" className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">{featured.title}</h2><p dir="auto" className="mt-5 leading-7 text-slate-500">{featured.excerpt}</p><p className="mt-6 text-xs text-slate-500">{blogDate(featured.created_at)} · {readingTime(featured.content)} min read</p><span className="mt-8 flex items-center gap-2 text-sm font-bold text-teal-700">Read the story <ArrowUpRight size={18} /></span></div>
      </Link>}
      <div className="mb-6 flex items-end justify-between"><h2 className="text-2xl font-bold text-slate-900">{featured ? 'More from the journal' : 'All articles'}</h2><span className="text-sm text-slate-500">{filtered.length} article{filtered.length !== 1 ? 's' : ''}</span></div>
      {filtered.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center"><BookOpen className="mx-auto mb-4 text-teal-600" size={36} /><h3 className="text-xl font-bold">{posts.length ? 'No matching stories' : 'Our next chapter is coming soon'}</h3><p className="mt-3 text-slate-500">{posts.length ? 'Try another search or category.' : 'Check back for fresh guides, ideas, and marketplace stories.'}</p>{posts.length > 0 && <button onClick={() => { setSearch(''); setCategory('All'); }} className="mt-5 font-bold text-teal-700">Clear filters</button>}</div> : <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">{remaining.slice(0, limit).map(post => <Link key={post.id} href={`/blogs/${post.slug}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"><BlogCover src={post.cover_image_url} title={post.title} className="aspect-[16/10]" /><div className="p-6"><p className="text-xs font-bold uppercase tracking-wider text-teal-700">{post.category}</p><h3 dir="auto" className="mt-3 line-clamp-2 text-xl font-bold leading-snug text-slate-900">{post.title}</h3><p dir="auto" className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">{post.excerpt}</p><div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500"><span>{blogDate(post.created_at)} · {readingTime(post.content)} min</span><ArrowUpRight size={18} className="text-teal-700" /></div></div></Link>)}</div>}
      {featured && remaining.length === 0 && <p className="text-slate-500">You’re all caught up. More stories are on the way.</p>}
      {remaining.length > limit && <div className="mt-10 text-center"><button onClick={() => setLimit(value => value + 9)} className="rounded-full bg-[#12343a] px-7 py-3 font-bold text-white">Load more articles</button></div>}
    </div>
  </>;
}
