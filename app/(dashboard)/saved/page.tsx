'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Heart, Search, MapPin, X, Loader2, AlertCircle, Package, Bookmark } from 'lucide-react';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';

interface SavedListing {
  id: string;
  listing_id: string;
  title: string;
  brand: string | null;
  category: string | null;
  price: number | null;
  location: string | null;
  image_urls: string[] | null;
  condition: string | null;
  status: string | null;
}

function ProductImage({ src, title }: { src?: string; title: string }) {
  const [failed, setFailed] = useState(false);
  return src && !failed
    ? <img src={src} alt={title} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
    : <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400"><Package size={32} strokeWidth={1.3} /><span className="text-xs">No photo available</span></div>;
}

export default function SavedPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [listings, setListings] = useState<SavedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [removing, setRemoving] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('recent');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    if (!user) { setListings([]); setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      setError('');
      setListings([]);
      try {
        const response = await fetch('/api/favorites', { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || 'Favorites lookup failed');
        const saved: SavedListing[] = (result.favorites || []).map((favorite: any) => ({
          id: favorite.id,
          listing_id: favorite.listing_id,
          title: favorite.listing?.title || '',
          brand: favorite.listing?.brand || null,
          category: favorite.listing?.category || null,
          price: favorite.listing?.price ?? null,
          location: favorite.listing?.location || null,
          image_urls: favorite.listing?.image_urls || [],
          condition: favorite.listing?.condition || null,
          status: favorite.listing?.status || null,
        }));
        if (active) setListings(saved);
      } catch {
        if (active) setError('We could not load your saved listings. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [authLoading, user, retry]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    const result = listings.filter(item => [item.title, item.brand, item.category, item.location].some(value => value?.toLowerCase().includes(search)));
    if (sort === 'low') result.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === 'high') result.sort((a, b) => Number(b.price) - Number(a.price));
    return result;
  }, [listings, query, sort]);

  const remove = async (item: SavedListing) => {
    if (!user || removing.includes(item.id)) return;
    setRemoving(current => [...current, item.id]);
    setActionError('');
    try {
      const response = await fetch('/api/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: item.listing_id }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Delete failed');
      setListings(current => current.filter(listing => listing.id !== item.id));
    } catch {
      setActionError('Could not remove this listing. Please try again.');
    } finally {
      setRemoving(current => current.filter(id => id !== item.id));
    }
  };

  const busy = authLoading || loading;
  const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-900">
      <Navbar forceSolid />
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-36 sm:px-6 lg:px-8 lg:pt-28">
        <header className="relative mb-6 overflow-hidden rounded-2xl border border-primary/20 bg-white p-5 sm:p-8">
          <div aria-hidden="true" className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-primary/10" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary"><Bookmark size={14} /> Your collection</div>
              <div className="flex items-center gap-3"><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('saved_listings')}</h1>
                {!busy && user && !error && <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-sm font-bold text-primary">{listings.length}</span>}
              </div>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Keep the products you like in one place. Pick up where you left off.</p>
            </div>
            <Link href="/buyer#products" className={`${buttonClass} shrink-0 self-start sm:self-center`}>{t('browse_marketplace')} <ArrowRight size={16} /></Link>
          </div>
        </header>

        {busy ? (
          <div role="status" aria-label="Loading saved listings" className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white motion-safe:animate-pulse"><div className="aspect-[4/3] bg-slate-200/70" /><div className="space-y-3 p-4"><div className="h-3 w-1/3 rounded bg-slate-100" /><div className="h-4 w-5/6 rounded bg-slate-100" /><div className="h-5 w-1/2 rounded bg-slate-100" /></div></div>)}
          </div>
        ) : !user ? (
          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center"><Heart className="mx-auto mb-4 text-primary" size={36} strokeWidth={1.5} /><h2 className="text-xl font-bold">Your next find is worth saving</h2><p className="mb-6 mt-2 text-sm text-slate-500">Sign in to see your saved products.</p><Link href="/login?next=%2Fsaved" className={buttonClass}>Sign in <ArrowRight size={16} /></Link></section>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-rose-200 bg-white p-8 text-center"><AlertCircle className="mx-auto mb-3 text-rose-500" /><p className="mb-4 text-sm text-slate-600">{error}</p><button onClick={() => setRetry(value => value + 1)} className={buttonClass}>Try again</button></div>
        ) : listings.length === 0 ? (
          <section className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center sm:py-24">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Heart size={34} strokeWidth={1.5} /></div>
            <h2 className="text-xl font-bold">{t('no_saved_yet')}</h2><p className="mb-6 mt-2 max-w-sm text-sm leading-6 text-slate-500">Tap the heart on any product to save it here for later.</p><Link href="/buyer#products" className={buttonClass}>{t('explore_products')} <ArrowRight size={16} /></Link>
          </section>
        ) : <>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md"><Search size={18} className="pointer-events-none absolute left-3.5 top-3 text-slate-400" /><input aria-label="Search saved listings" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search your saved products" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />{query && <button aria-label="Clear search" onClick={() => setQuery('')} className="absolute right-2 top-2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={16} /></button>}</div>
            <div className="flex items-center justify-between gap-3"><p aria-live="polite" className="text-xs text-slate-500">{filtered.length} {filtered.length === 1 ? 'listing' : 'listings'}</p><select aria-label="Sort saved listings" value={sort} onChange={event => setSort(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-primary"><option value="recent">Recently saved</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></div>
          </div>
          {actionError && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{actionError}</p>}
          {filtered.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center"><Search size={28} className="mx-auto mb-3 text-slate-400" /><h2 className="font-semibold">No saved products match your search</h2><button onClick={() => setQuery('')} className="mt-3 text-sm font-semibold text-primary hover:underline">Clear search</button></div> : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map(item => <article key={item.id} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-primary/30 hover:shadow-md">
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <Link href={`/listings/${item.listing_id}`} className="block h-full focus-visible:outline-2 focus-visible:outline-primary"><ProductImage src={item.image_urls?.[0]} title={item.title} /></Link>
                  {item.condition && <span className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-white/95 px-2 py-1 text-[10px] font-semibold capitalize text-slate-600 shadow-sm">{item.condition}</span>}
                  <button aria-label={`Remove ${item.title} from saved listings`} title="Remove from saved" disabled={removing.includes(item.id)} onClick={() => void remove(item)} className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full border border-white bg-white/95 text-primary shadow-sm transition hover:bg-rose-50 hover:text-rose-500 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50">{removing.includes(item.id) ? <Loader2 size={17} className="animate-spin" /> : <Heart size={17} fill="currentColor" />}</button>
                </div>
                <div className="flex flex-1 flex-col p-3 sm:p-4">
                  <p className="mb-1 truncate text-[10px] font-semibold uppercase tracking-wide text-slate-400">{item.brand || item.category || 'Product'}</p>
                  <Link href={`/listings/${item.listing_id}`} className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-800 hover:text-primary">{item.title}</Link>
                  <p className="mt-3 text-sm font-bold text-primary sm:text-lg">{item.price == null ? 'Price not specified' : `PKR ${Number(item.price).toLocaleString()}`}</p>
                  {item.location && <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-500"><MapPin size={12} className="shrink-0" /><span className="truncate">{item.location}</span></p>}
                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3"><span className={`truncate text-[10px] font-medium ${item.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`}>{item.status === 'active' ? 'Active listing' : item.status === 'sold' ? 'Sold' : 'Unavailable'}</span><Link href={`/listings/${item.listing_id}`} aria-label={`View ${item.title}`} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">View <ArrowRight size={13} /></Link></div>
                </div>
              </article>)}
            </div>
          )}
        </>}
      </main>
      <div className="hidden lg:block"><Footer /></div>
    </div>
  );
}
