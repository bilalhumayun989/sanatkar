'use client';

import { refreshOnRealtime } from '@/lib/realtime/client';

import { useEffect, useState, type FormEvent, type MouseEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, BadgeCheck, Heart, MapPin, Search, SlidersHorizontal, Store } from 'lucide-react';
import PriceSlider, { type PriceRange } from './components/PriceSlider';
import CategoriesSection from './api/categories/Category';
import FeaturedListing from './components/Feature-listing/FeaturedListing';
import FeaturedListingsMobile from './components/mobile/FeaturedListingMobile';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomeAdSlot from './components/ads/HomeAdSlot';
import TrendingSection from './components/TrendingSection';

// Set to true when home-page advertising is ready.
const SHOW_HOME_ADS = false;

interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
}

interface Shop {
  id: string;
  seller_id: string;
  title: string;
  image_urls: string[] | null;
  verification_status: string | null;
}

interface VerifiedSeller {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  shop_name: string | null;
  shop_image_url: string | null;
}

export interface Listing {
  id: string;
  title: string;
  price: number | null;
  location: string | null;
  image_urls: string[] | null;
  brand: string | null;
  category: string | null;
  condition: string | null;
  model?: string | null;
  year?: string | null;
  stock_status?: string | null;
  created_at?: string | null;
}

interface HomeCategory {
  id: string;
  name: string;
  image_url?: string | null;
  is_active?: boolean | null;
  is_popular?: boolean;
}

function SectionHeading({ title, href, linkLabel = 'View all', headingId }: { title: string; href: string; linkLabel?: string; headingId?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 id={headingId} className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">{title}</h2>
      <Link href={href} className="shrink-0 text-sm font-medium text-[#006b80] hover:text-[#005466]">
        {linkLabel}
      </Link>
    </div>
  );
}

function formatPostedTime(createdAt?: string | null) {
  if (!createdAt) return null;
  const timestamp = new Date(createdAt).getTime();
  if (Number.isNaN(timestamp)) return null;

  const hoursAgo = Math.max(0, Math.floor((Date.now() - timestamp) / (60 * 60 * 1000)));
  if (hoursAgo < 1) return 'Just now';
  if (hoursAgo < 24) return `${hoursAgo}h ago`;
  const daysAgo = Math.floor(hoursAgo / 24);
  return `${daysAgo}d ago`;
}

function ProductCard({
  listing,
  isSaved,
  onToggleSave,
}: {
  listing: Listing;
  isSaved: boolean;
  onToggleSave: (event: MouseEvent<HTMLButtonElement>, listingId: string) => void;
}) {
  const condition = listing.condition?.toLowerCase();
  const modelDetails = [listing.model, listing.year].filter(Boolean).join(' â€¢ ');

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-2.5 transition-shadow duration-150 hover:border-cyan-300 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100">
        <Image
          src={listing.image_urls?.[0] || '/placeholder.png'}
          alt={listing.title}
          fill
          sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 280px"
          loading="lazy"
          decoding="async"
          quality={70}
          className="object-contain p-2 transition-transform duration-200 group-hover:scale-105"
        />
        {condition && (
          <span className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize shadow-sm ${
            condition === 'new' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {listing.condition}
          </span>
        )}
        <button
          type="button"
          onClick={(event) => onToggleSave(event, listing.id)}
          aria-label={isSaved ? 'Remove from saved listings' : 'Save listing'}
          aria-pressed={isSaved}
          className={`absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-colors ${
            isSaved ? 'bg-rose-50 text-rose-600' : 'bg-white/95 text-slate-500 hover:text-rose-600'
          }`}
        >
          <Heart className="h-4 w-4" fill={isSaved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="flex min-w-0 flex-1 flex-col px-0.5 pb-0.5 pt-3">
        <p className="truncate text-xs font-medium uppercase tracking-wider text-slate-400">{listing.brand || listing.category || 'Marketplace'}</p>
        <h3 className="mt-1.5 line-clamp-2 min-h-10 text-sm font-normal leading-5 text-slate-900 transition-colors group-hover:text-[#006b80]">{listing.title}</h3>
        <p className="mt-1 min-h-4 truncate text-[11px] text-slate-400">
          {modelDetails ? `Model: ${modelDetails}` : 'Compatibility details on listing'}
        </p>
        <div className="mt-auto border-t border-slate-100 pt-2">
          <p className="whitespace-nowrap text-base font-medium text-slate-900">PKR {Number(listing.price || 0).toLocaleString()}</p>
          <div className="mt-1 flex min-w-0 items-center gap-1.5 truncate text-xs text-slate-400">
            {listing.location && (
              <>
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{listing.location}</span>
              </>
            )}
            {(listing.location && (listing.stock_status || formatPostedTime(listing.created_at))) && <span aria-hidden="true">·</span>}
            <span className="truncate">{listing.stock_status || formatPostedTime(listing.created_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Home({
  categories: initialCategories,
  brands: initialBrands,
  shops: initialShops,
  verifiedSellers: initialVerifiedSellers,
  recentListings: initialListings,
  featuredListings,
  trendingListings,
}: {
  categories: HomeCategory[];
  brands: Brand[];
  shops: Shop[];
  verifiedSellers: VerifiedSeller[];
  recentListings: Listing[];
  featuredListings: Listing[];
  trendingListings: Listing[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState<PriceRange>([0, null]);
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [verifiedSellers] = useState<VerifiedSeller[]>(initialVerifiedSellers);
  const [categories, setCategories] = useState<HomeCategory[]>(initialCategories);
  const [recentListings, setRecentListings] = useState<Listing[]>(initialListings);
  const [recentCategory, setRecentCategory] = useState('All');
  const [savedListingIds, setSavedListingIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [storefrontLoading] = useState(false);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        // Run auth check and favorites in parallel — avoids a sequential waterfall
        const [meResponse, favoritesResponse] = await Promise.all([
          fetch('/api/auth/me', { cache: 'no-store' }),
          fetch('/api/favorites', { cache: 'no-store' }),
        ]);
        const meResult = await meResponse.json();
        if (!meResponse.ok || !meResult.success || !meResult.user) return;
        setUserId(meResult.user.id);
        const favoritesResult = await favoritesResponse.json();
        if (favoritesResponse.ok && favoritesResult.success) {
          setSavedListingIds((favoritesResult.favorites || []).map((favorite: { listing_id: string }) => favorite.listing_id));
        }
      } catch (error) {
        console.error('Failed to load saved listings:', error);
      }
    };
    fetchFavorites();
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = refreshOnRealtime(['listings', 'catalog'], (event) => {
      if (event.topic === 'ready') return; // ignore initial connection ping
      // debounce — multiple rapid events collapse into one refresh
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 3000);
    });
    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [router]);

  // Props come from the server on initial load; they only change on router.refresh().
  // No need to re-sync into state — the initial useState values are sufficient.

  const applySearch = () => {
    const params = new URLSearchParams();
    const query = search.trim();
    if (query) params.set('search', query);
    if (categoryFilter) params.set('category', categoryFilter);
    if (brandFilter) params.set('brand', brandFilter);
    if (priceFilter[0] > 0) params.set('minPrice', String(priceFilter[0]));
    if (priceFilter[1] !== null) params.set('maxPrice', String(priceFilter[1]));
    router.push(`/buyer${params.size ? `?${params.toString()}` : ''}#products`);
    setIsFilterOpen(false);
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applySearch();
  };

  const toggleRecentListingSave = async (event: MouseEvent<HTMLButtonElement>, listingId: string) => {
    event.preventDefault();
    event.stopPropagation();

    if (!userId) {
      router.push(`/login?next=${encodeURIComponent(`/listings/${listingId}`)}`);
      return;
    }

    const wasSaved = savedListingIds.includes(listingId);
    setSavedListingIds((current) => wasSaved
      ? current.filter((id) => id !== listingId)
      : [...current, listingId]);

    try {
      const response = await fetch('/api/favorites', {
        method: wasSaved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Failed to update saved listing.');
    } catch (error) {
      console.error('Failed to update saved listing:', error);
      setSavedListingIds((current) => wasSaved
        ? [...current, listingId]
        : current.filter((id) => id !== listingId));
    }
  };

  const filteredRecentListings = recentListings.filter((listing) => {
    if (recentCategory === 'All') return true;
    const category = listing.category?.toLowerCase() || '';
    const searchText = `${listing.title} ${listing.brand || ''} ${category}`.toLowerCase();
    if (recentCategory === 'Tractors') return searchText.includes('tractor');
    if (recentCategory === 'Auto Parts') return category.includes('part') || /auto|car|vehicle|brake|spare part/.test(searchText);
    return /lubricant|oil|grease/.test(searchText);
  });

  const activeSearchFilters = Number(Boolean(categoryFilter)) + Number(Boolean(brandFilter)) + Number(priceFilter[0] > 0 || priceFilter[1] !== null);

  return (
    <div className="min-h-screen bg-[#f6f8f9] text-slate-900 lg:pt-16">
      <Navbar />

      <div className={SHOW_HOME_ADS
        ? "mx-auto grid w-full max-w-[1680px] grid-cols-1 gap-7 px-4 pb-10 pt-[124px] sm:px-6 lg:grid-cols-[minmax(0,1fr)_200px] lg:gap-6 lg:px-8 lg:pt-6"
        : "mx-auto w-full max-w-[1440px] px-4 pb-10 pt-[124px] sm:px-6 lg:px-8 lg:pt-6"}>
        {SHOW_HOME_ADS && <HomeAdSlot />}
      <main className="min-w-0 space-y-6 lg:col-start-1 lg:row-start-1 lg:space-y-8">
        <form onSubmit={submitSearch} className="hidden lg:block">
          <div className="relative">
            <div className="flex h-14 w-full items-center gap-2 rounded-full border border-slate-200 bg-white p-1.5 shadow-[0_3px_12px_rgba(15,23,42,0.07)] transition focus-within:border-[#13bdc4] focus-within:ring-2 focus-within:ring-[#13bdc4]/15">
              <div className="flex min-w-0 flex-1 items-center gap-3 pl-3">
                <Search className="h-5 w-5 shrink-0 text-[#006b80]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search products, brands, or sellers"
                  placeholder="Search products, brands, or sellers"
                  className="min-w-0 flex-1 bg-transparent text-[15px] text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>
              <button
                type="button"
                aria-expanded={isFilterOpen}
                aria-label="Open search filters"
                onClick={() => setIsFilterOpen((open) => !open)}
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-[#e8f7f8] hover:text-[#087c91] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#079bb5]"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeSearchFilters > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#006b80] px-1 text-[11px] font-bold text-white">
                    {activeSearchFilters}
                  </span>
                )}
              </button>
              <span aria-hidden="true" className="h-7 w-px bg-slate-200" />
              <button type="submit" className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-[#006b80] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#005466] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006b80] focus-visible:ring-offset-2">
                <Search className="h-4 w-4" />
                Search
              </button>
            </div>

            {isFilterOpen && (
              <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[360px] max-w-[calc(100vw-48px)] rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">Filter products</h2>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter('');
                      setBrandFilter('');
                      setPriceFilter([0, null]);
                    }}
                    className="text-xs font-semibold text-[#006b80] hover:text-[#005466]"
                  >
                    Clear filters
                  </button>
                </div>
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-600">
                    Category
                    <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-[#13bdc4] focus:ring-2 focus:ring-[#13bdc4]/15">
                      <option value="">All categories</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.name.toLowerCase()}>{category.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-slate-600">
                    Brand
                    <select value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-[#13bdc4] focus:ring-2 focus:ring-[#13bdc4]/15">
                      <option value="">All brands</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.name}>{brand.name}</option>
                      ))}
                    </select>
                  </label>
                  <PriceSlider value={priceFilter} onChange={setPriceFilter} />
                </div>
                <button type="button" onClick={applySearch} className="mt-5 h-10 w-full rounded-lg bg-[#006b80] text-sm font-semibold text-white transition-colors hover:bg-[#005466]">
                  Apply filters
                </button>
              </div>
            )}
          </div>
        </form>

        <section aria-labelledby="brands-heading" className="min-h-[152px]">
            <SectionHeading title="Shop by brand" href="/brands" headingId="brands-heading" />
            {storefrontLoading ? (
              <div aria-hidden="true" className="flex gap-4 overflow-hidden pb-2 sm:gap-6">
                {Array.from({ length: 6 }, (_, index) => <div key={index} className="flex w-[76px] shrink-0 flex-col items-center gap-2 sm:w-[88px]"><span className="aspect-square w-full animate-pulse rounded-full bg-slate-200" /><span className="h-3 w-14 animate-pulse rounded bg-slate-200" /></div>)}
              </div>
            ) : brands.length === 0 ? <p className="flex h-[80px] items-center text-sm text-slate-600">No brands listed yet.</p> : (
            <div className="scrollbar-hide flex touch-pan-x overscroll-x-contain gap-4 overflow-x-auto pb-2 sm:gap-6">
              {brands.slice(0, 8).map((brand) => (
                <Link
                  key={brand.id}
                  href={`/buyer?brand=${encodeURIComponent(brand.name)}#products`}
                  className="group flex w-[76px] shrink-0 flex-col items-center gap-2 text-center sm:w-[88px]"
                >
                  <span className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-full bg-white p-3 shadow-sm transition-transform group-hover:scale-105">
                    {brand.logo_url ? (
                      <Image src={brand.logo_url} alt={brand.name} width={48} height={48} loading="lazy" decoding="async" unoptimized className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-lg font-bold text-[#006b80]">{brand.name.slice(0, 1).toUpperCase()}</span>
                    )}
                  </span>
                  <span className="w-full truncate text-xs font-medium text-slate-600">{brand.name}</span>
                </Link>
              ))}
            </div>
            )}
        </section>

        <section aria-labelledby="shops-heading" className="min-h-[132px]">
            <SectionHeading title="Explore shops" href="/shops" headingId="shops-heading" />
            {storefrontLoading ? (
              <div aria-hidden="true" className="flex gap-3 overflow-hidden">
                {Array.from({ length: 3 }, (_, index) => <div key={index} className="flex h-[72px] w-[210px] shrink-0 animate-pulse items-center gap-3 rounded-lg border border-slate-200 bg-white p-3"><span className="h-12 w-12 rounded-full bg-slate-200" /><span className="h-4 w-28 rounded bg-slate-200" /></div>)}
              </div>
            ) : shops.length === 0 ? <p className="flex h-[72px] items-center text-sm text-slate-600">No shops listed yet.</p> : (
            <div className="scrollbar-hide flex touch-pan-x overscroll-x-contain gap-3 overflow-x-auto pb-2">
              {shops.slice(0, 5).map((shop) => (
                <Link
                  key={shop.id}
                  href={`/shop/${shop.seller_id}`}
                  className="group flex w-[260px] shrink-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow duration-150 hover:border-cyan-200 hover:shadow-md"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#e8f7f8] text-[#006b80]">
                    {shop.image_urls?.[1] || shop.image_urls?.[0] ? (
                      <Image src={shop.image_urls?.[1] || shop.image_urls?.[0] || ''} alt="" width={48} height={48} loading="lazy" decoding="async" unoptimized className="h-full w-full object-cover" />
                    ) : (
                      <Store className="h-5 w-5" />
                    )}
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-1.5">
                    <span className="whitespace-normal break-words text-sm font-normal leading-5 text-slate-900 group-hover:text-[#006b80]">{shop.title}</span>
                    {shop.verification_status === 'verified' && <BadgeCheck aria-label="Verified" className="h-4 w-4 shrink-0 text-emerald-600" />}
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition-colors group-hover:bg-cyan-50 group-hover:text-[#006b80]">
                    <ArrowRight className="h-4 w-4" />
                    </span>
                </Link>
              ))}
            </div>
            )}
        </section>

        <CategoriesSection categories={categories} prioritizeFirstImage maxItems={8} />
        {categories.some(category => category.is_popular) && <CategoriesSection categories={categories.filter(category => category.is_popular)} title="Popular categories" variant="popular" maxItems={8} />}

        {/* <section aria-labelledby="verified-sellers-heading">
          <SectionHeading title="Verified sellers" href="/shops" linkLabel="Meet our sellers" />
          {sellersError && <div role="alert" className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <span>Could not refresh verified sellers.</span>
            <button type="button" onClick={() => setSellerRetry(value => value + 1)} className="shrink-0 font-semibold underline">Try again</button>
          </div>}
          {verifiedSellers.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {verifiedSellers.map((seller) => (
                <Link
                  key={seller.id}
                  href={`/shop/${seller.id}`}
                  className="flex min-w-0 flex-col items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-center sm:flex-row sm:text-left hover:border-emerald-300"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-50 text-emerald-700">
                    {seller.avatar_url || seller.shop_image_url ? (
                      <Image src={seller.avatar_url || seller.shop_image_url || ''} alt="" width={44} height={44} unoptimized className="h-full w-full object-cover" />
                    ) : (
                      <Store className="h-5 w-5" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{seller.shop_name || seller.full_name || seller.username || 'Verified seller'}</span>
                    <span className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-700">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verified seller
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
              {sellersLoading ? 'Loading verified sellers...' : sellersError ? 'Seller information is temporarily unavailable.' : 'No verified sellers yet.'}
            </p>
          )}
        </section> */}

        <div className="lg:hidden">
          <FeaturedListingsMobile initialListings={featuredListings.slice(0, 3)} />
        </div>
        <div className="hidden lg:block">
          <FeaturedListing initialListings={featuredListings} />
        </div>

        <TrendingSection listings={trendingListings.length > 0 ? trendingListings : recentListings} />

        <section aria-labelledby="recent-listings-heading" className="home-deferred-listings">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="recent-listings-heading" className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">Recent Listings</h2>
            <Link href="/buyer" className="shrink-0 text-sm font-medium text-[#006b80] hover:text-[#005466]">
              View all
            </Link>
          </div>
          <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter recent listings by category">
            {['All', 'Tractors', 'Auto Parts', 'Lubricants'].map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setRecentCategory(category)}
                aria-pressed={recentCategory === category}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  recentCategory === category
                    ? 'border-[#006b80] bg-[#006b80] text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:text-[#006b80]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          {filteredRecentListings.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-8 xl:grid-cols-4">
              {filteredRecentListings.map((listing) => (
                <ProductCard
                  key={listing.id}
                  listing={listing}
                  isSaved={savedListingIds.includes(listing.id)}
                  onToggleSave={toggleRecentListingSave}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
              {recentListings.length ? 'No listings in this category yet.' : 'New listings will appear here.'}
            </p>
          )}
        </section>

      </main>
      </div>

      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  );
}
