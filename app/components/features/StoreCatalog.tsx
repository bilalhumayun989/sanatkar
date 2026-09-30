'use client';

import { useMemo, useState } from 'react';
import { Search, Package, X } from 'lucide-react';
import PartCard from './PartCard';
import type { Part } from '@/lib/database/mockData';

export default function StoreCatalog({ parts }: { parts: Part[] }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('recent');
  const [visible, setVisible] = useState(12);
  const categories = Array.from(new Set(parts.map(part => part.category).filter(Boolean)));
  const filtered = useMemo(() => {
    const result = parts.filter(part => (!category || part.category === category) && `${part.partName} ${part.brand}`.toLowerCase().includes(search.trim().toLowerCase()));
    if (sort === 'low') result.sort((a, b) => a.price - b.price);
    if (sort === 'high') result.sort((a, b) => b.price - a.price);
    return result;
  }, [parts, search, category, sort]);
  return <section id="store-products" className="scroll-mt-36 lg:scroll-mt-24">
    <div className="mb-5 flex items-end justify-between gap-3"><div><p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">Browse the collection</p><h2 className="text-2xl font-bold tracking-tight text-slate-900">Store products</h2></div><span aria-live="polite" className="text-xs text-slate-500">{filtered.length} products</span></div>
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row">
      <div className="relative flex-1"><Search size={17} className="absolute left-3 top-3.5 text-slate-400" /><input aria-label="Search store products" value={search} onChange={e => { setSearch(e.target.value); setVisible(12); }} placeholder="Search this store" className="h-11 w-full rounded-xl bg-slate-50 pl-10 pr-9 text-sm outline-none focus:ring-2 focus:ring-primary/20" />{search && <button aria-label="Clear search" onClick={() => { setSearch(''); setVisible(12); }} className="absolute right-2 top-3 text-slate-400"><X size={17} /></button>}</div>
      <select aria-label="Product category" value={category} onChange={e => { setCategory(e.target.value); setVisible(12); }} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"><option value="">All categories</option>{categories.map(value => <option key={value}>{value}</option>)}</select>
      <select aria-label="Sort store products" value={sort} onChange={e => { setSort(e.target.value); setVisible(12); }} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"><option value="recent">Newest first</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select>
    </div>
    {filtered.length ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.slice(0, visible).map(part => <PartCard key={part.id} part={part} compact />)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"><Package size={32} className="mx-auto mb-3 text-slate-400" /><h3 className="font-semibold">{parts.length ? 'No matching products' : 'New products are on their way'}</h3><p className="mt-2 text-sm text-slate-500">{parts.length ? 'Try a different search or category.' : 'Check back to see what this store adds next.'}</p>{parts.length > 0 && <button onClick={() => { setSearch(''); setCategory(''); setVisible(12); }} className="mt-4 text-sm font-semibold text-primary">Clear filters</button>}</div>}
    {filtered.length > visible && <div className="mt-8 text-center"><button onClick={() => setVisible(count => count + 12)} className="rounded-xl border border-primary/20 bg-white px-6 py-3 text-sm font-semibold text-primary hover:bg-primary/5">Show more products</button></div>}
  </section>;
}
