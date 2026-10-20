'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Search, SlidersHorizontal, Store } from 'lucide-react';
import { FIXED_CATEGORY_OPTIONS } from '@/lib/categoryConstants';
import PriceSlider, { type PriceRange } from './components/PriceSlider';
import CategoriesSection from './api/categories/Category';
import FeaturedListing from './components/Feature-listing/FeaturedListing';
import FeaturedListingsMobile from './components/mobile/FeaturedListingMobile';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomeAdSlot from './components/ads/HomeAdSlot';

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
  verification_status: string;
}

interface VerifiedSeller {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  shop_name: string | null;
  shop_image_url: string | null;
}

interface Listing {
  id: string;
  title: string;
  price: number | null;
  location: string | null;
  image_urls: string[] | null;
  brand: string | null;
  category: string | null;
  condition: string | null;
}

interface HomeCategory {
  id: string;
  name: string;
  image_url?: string | null;
  is_active?: boolean;
  is_popular?: boolean;
}

function SectionHeading({ title, href, linkLabel = 'View all' }: { title: string; href: string; linkLabel?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{title}</h2>
      <Link href={href} className="shrink-0 text-sm font-semibold text-[#079bb5] hover:text-[#087c91]">
        {linkLabel}
      </Link>
    </div>
  );
}

function ProductCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square bg-slate-100">
        <Image
          src={listing.image_urls?.[0] || '/placeholder.png'}
          alt={listing.title}
          fill
          sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 220px"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {listing.condition && (
          <span className="absolute left-2 top-2 rounded bg-white/95 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow-sm">
            {listing.condition}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-xs font-medium text-slate-500">{listing.brand || listing.category || 'Marketplace'}</p>
        <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-900">{listing.title}</h3>
        <p className="mt-2 text-sm font-bold text-[#079bb5]">PKR {Number(listing.price || 0).toLocaleString()}</p>
        {listing.location && <p className="mt-1 truncate text-xs text-slate-500">{listing.location}</p>}
      </div>
    </Link>
  );
}

export default function Home() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState<PriceRange>([0, null]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [verifiedSellers, setVerifiedSellers] = useState<VerifiedSeller[]>([]);
  const [sellersLoading, setSellersLoading] = useState(true);
  const [sellersError, setSellersError] = useState(false);
  const [sellerRetry, setSellerRetry] = useState(0);
  const [categories, setCategories] = useState<HomeCategory[]>([]);
  const [recentListings, setRecentListings] = useState<Listing[]>([]);

  useEffect(() => {
    let active = true;

    const loadStorefront = async () => {
      const responses = await Promise.all([
        fetch('/api/brands', { cache: 'no-store' }),
        fetch('/api/shops?limit=12', { cache: 'no-store' }),
        fetch('/api/listings?limit=8', { cache: 'no-store' }),
      ]);
      const [brandResult, shopResult, listingResult] = await Promise.all(responses.map(response => response.json()));
      if (!active) return;
      setBrands(brandResult.brands || []);
      setShops(shopResult.shops || []);
      setRecentListings(listingResult.data || []);

      try {
        const response = await fetch('/api/categories');
        const result = await response.json();
        if (active && result.success && Array.isArray(result.categories) && result.categories.length) {
          setCategories(result.categories);
          return;
        }
      } catch {
        // Use the built-in categories when the category endpoint is unavailable.
      }

      if (active) {
        setCategories(FIXED_CATEGORY_OPTIONS.map((item) => ({
          id: item.value,
          name: item.label,
          image_url: null,
          is_active: true,
        })));
      }
    };

    loadStorefront().catch((error) => {
      console.error('Failed to load storefront:', error);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let inFlight = false;
    const loadSellers = async () => {
      if (inFlight) return;
      inFlight = true;
      setSellersError(false);
      try {
        const response = await fetch('/api/verified-sellers', { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Unable to load verified sellers');
        const result = await response.json();
        if (!Array.isArray(result.sellers)) throw new Error('Invalid seller response');
        if (!controller.signal.aborted) setVerifiedSellers(result.sellers);
      } catch {
        if (!controller.signal.aborted) setSellersError(true);
      } finally {
        inFlight = false;
        if (!controller.signal.aborted) setSellersLoading(false);
      }
    };
    setSellersLoading(true);
    void loadSellers();
    const refresh = () => { if (document.visibilityState === 'visible') void loadSellers(); };
    window.addEventListener('focus', refresh);
    const interval = window.setInterval(refresh, 60000);
    return () => {
      controller.abort();
      window.removeEventListener('focus', refresh);
      window.clearInterval(interval);
    };
  }, [sellerRetry]);

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

  const activeSearchFilters = Number(Boolean(categoryFilter)) + Number(Boolean(brandFilter)) + Number(priceFilter[0] > 0 || priceFilter[1] !== null);

  return (
    <div className="min-h-screen bg-[#f6f8f9] text-slate-900 lg:pt-16">
      <Navbar />

      <div className={SHOW_HOME_ADS
        ? "mx-auto grid w-full max-w-[1680px] grid-cols-1 gap-7 px-4 pb-10 pt-[124px] sm:px-6 lg:grid-cols-[minmax(0,1fr)_200px] lg:gap-6 lg:px-8 lg:pt-6"
        : "mx-auto w-full max-w-[1440px] px-4 pb-10 pt-[124px] sm:px-6 lg:px-8 lg:pt-6"}>
        {SHOW_HOME_ADS && <HomeAdSlot />}
      <main className="min-w-0 space-y-7 lg:col-start-1 lg:row-start-1 lg:space-y-9">
        <form onSubmit={submitSearch} className="hidden lg:block">
          <div className="relative">
            <div className="flex h-14 w-full items-center gap-2 rounded-full border border-slate-200 bg-white p-1.5 shadow-[0_3px_12px_rgba(15,23,42,0.07)] transition focus-within:border-[#13bdc4] focus-within:ring-2 focus-within:ring-[#13bdc4]/15">
              <div className="flex min-w-0 flex-1 items-center gap-3 pl-3">
                <Search className="h-5 w-5 shrink-0 text-[#079bb5]" />
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
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#079bb5] px-1 text-[11px] font-bold text-white">
                    {activeSearchFilters}
                  </span>
                )}
              </button>
              <span aria-hidden="true" className="h-7 w-px bg-slate-200" />
              <button type="submit" className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-[#079bb5] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#087c91] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#079bb5] focus-visible:ring-offset-2">
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
                    className="text-xs font-semibold text-[#079bb5] hover:text-[#087c91]"
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
                <button type="button" onClick={applySearch} className="mt-5 h-10 w-full rounded-lg bg-[#079bb5] text-sm font-semibold text-white transition-colors hover:bg-[#087c91]">
                  Apply filters
                </button>
              </div>
            )}
          </div>
        </form>

        {brands.length > 0 && (
          <section aria-labelledby="brands-heading">
            <SectionHeading title="Shop by brand" href="/brands" />
            <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-6">
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/buyer?brand=${encodeURIComponent(brand.name)}#products`}
                  className="group flex w-[76px] shrink-0 flex-col items-center gap-2 text-center sm:w-[88px]"
                >
                  <span className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-full border-2 border-[#13bdc4] bg-white p-3 transition-transform group-hover:scale-105">
                    {brand.logo_url ? (
                      <Image src={brand.logo_url} alt={brand.name} width={48} height={48} unoptimized className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-lg font-bold text-[#079bb5]">{brand.name.slice(0, 1).toUpperCase()}</span>
                    )}
                  </span>
                  <span className="w-full truncate text-xs font-semibold text-slate-700">{brand.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {shops.length > 0 && (
          <section aria-labelledby="shops-heading">
            <SectionHeading title="Explore shops" href="/shops" />
            <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {shops.slice(0, 8).map((shop) => (
                <Link
                  key={shop.id}
                  href={`/shop/${shop.seller_id}`}
                  className="flex w-[210px] shrink-0 items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:border-[#13bdc4]"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e8f7f8] text-[#079bb5]">
                    {shop.image_urls?.[1] || shop.image_urls?.[0] ? (
                      <Image src={shop.image_urls?.[1] || shop.image_urls?.[0] || ''} alt="" width={48} height={48} unoptimized className="h-full w-full object-cover" />
                    ) : (
                      <Store className="h-5 w-5" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-900">{shop.title}</span>
                    <span className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      {shop.verification_status === 'verified' && <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />}
                      {shop.verification_status === 'verified' ? 'Verified shop' : 'Visit shop'}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <CategoriesSection categories={categories} />
        {categories.some(category => category.is_popular) && <CategoriesSection categories={categories.filter(category => category.is_popular)} title="Popular categories" />}

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
          <FeaturedListingsMobile />
        </div>
        <div className="hidden lg:block">
          <FeaturedListing />
        </div>

        <section aria-labelledby="recent-listings-heading">
          <SectionHeading title="Recent listings" href="/buyer" />
          {recentListings.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {recentListings.map((listing) => <ProductCard key={listing.id} listing={listing} />)}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
              New listings will appear here.
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
