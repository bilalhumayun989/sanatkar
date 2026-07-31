'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import PartCard from '@/app/components/PartCard';
import { Search, SlidersHorizontal, Check, Loader2, X, Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/LanguageContext';
import { FIXED_CATEGORY_OPTIONS, normalizeCategoryValue } from '@/lib/categoryConstants';

interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
}

interface ListingRecord {
  id: string;
  title: string;
  brand: string;
  make: string;
  model: string;
  price: number;
  location: string;
  city: string;
  image_urls: string[];
  condition: string;
  category: string;
  created_at: string;
  status: string;
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}> 
      <CategoryPageContent />
    </Suspense>
  );
}

function CategoryPageContent() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug as string;
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const [category, setCategory] = useState<CategoryRecord | null>(null);
  const [listings, setListings] = useState<ListingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('most_recent');

  const priceRanges = [
    { id: 'under_5k', label: 'Under 5,000', min: 0, max: 5000 },
    { id: '5k_15k', label: '5,000 - 15,000', min: 5000, max: 15000 },
    { id: '15k_50k', label: '15,000 - 50,000', min: 15000, max: 50000 },
    { id: '50k_plus', label: '50,000+', min: 50000, max: Infinity },
  ];

  useEffect(() => {
    const loadCategoryData = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const normalizedSlug = normalizeCategoryValue(slug);
        const fallbackCategory = FIXED_CATEGORY_OPTIONS.find((option) => option.value === normalizedSlug);
        setCategory({
          id: normalizedSlug,
          name: fallbackCategory?.label || normalizedSlug.charAt(0).toUpperCase() + normalizedSlug.slice(1),
          slug: normalizedSlug,
        });

        const { data: listingsData, error: listingsError } = await supabase
          .from('listings')
          .select('id, title, brand, make, model, price, location, city, image_urls, condition, category, created_at, status')
          .eq('category', normalizedSlug)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (!listingsError) {
          setListings((listingsData || []) as ListingRecord[]);
        } else {
          setListings([]);
        }
      } catch {
        setCategory({ id: slug, name: slug.charAt(0).toUpperCase() + slug.slice(1), slug });
        setListings([]);
      } finally {
        setLoading(false);
      }
    };

    if (slug) loadCategoryData();
  }, [slug]);

  const filteredListings = useMemo(() => {
    let result = [...listings];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((listing) => {
        const title = `${listing.title || ''} ${listing.brand || ''} ${listing.make || ''} ${listing.model || ''}`.toLowerCase();
        return title.includes(q) || (listing.category || '').toLowerCase().includes(q);
      });
    }

    if (selectedPriceRanges.length > 0) {
      result = result.filter((listing) => selectedPriceRanges.some((id) => {
        const range = priceRanges.find((item) => item.id === id);
        return range ? Number(listing.price) >= range.min && Number(listing.price) < range.max : false;
      }));
    }

    switch (sortBy) {
      case 'price_low_high':
        result.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'price_high_low':
        result.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      default:
        result.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
    }

    return result;
  }, [listings, searchQuery, selectedPriceRanges, sortBy]);

  const handlePriceToggle = (id: string) => {
    setSelectedPriceRanges((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedPriceRanges([]);
    setSortBy('most_recent');
  };

  const activeFilterCount = selectedPriceRanges.length + (searchQuery ? 1 : 0);

  const mappedListings = filteredListings.map((listing) => ({
    id: listing.id,
    brand: listing.brand || listing.make || 'Unknown',
    partName: listing.title || `${listing.make || ''} ${listing.model || ''}`.trim() || 'Listing',
    price: Number(listing.price) || 0,
    location: listing.location || listing.city || 'Pakistan',
    image: Array.isArray(listing.image_urls) && listing.image_urls[0]
      ? listing.image_urls[0]
      : '/hero.jpg',
    compatibility: 'Universal',
    condition: listing.condition || 'New',
    stockStatus: 'In Stock',
    isFeatured: listing.status === 'active',
    sellerRole: null,
    sellerId: null,
    sellerName: null,
    category: listing.category || slug,
    createdAt: listing.created_at || new Date().toISOString(),
  }));

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <Navbar />
      <div className="flex-1">
        <section className="bg-black py-20 md:py-28">
          <div className="container-wide">
            <div className="max-w-3xl">
              <Link href="/buyer" className="text-sm font-semibold text-white/70 hover:text-white transition-colors">
                ← Back to Marketplace
              </Link>
              <h1 className="mt-4 text-4xl md:text-5xl font-black text-white leading-tight">
                {category?.name || 'Category'}
              </h1>
              <p className="mt-4 text-sm md:text-base text-white/70">
                Discover active listings in this category, filtered to match your preferences.
              </p>
            </div>
          </div>
        </section>

        <div className="container-wide py-10 md:py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="hidden lg:block w-72 shrink-0">
              <div className="rounded-[2rem] border border-gray-200 bg-white p-8 sticky top-24">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    {t('filters')} <SlidersHorizontal size={18} className="text-primary" />
                    {activeFilterCount > 0 && (
                      <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full ml-1">{activeFilterCount}</span>
                    )}
                  </h3>
                  <button onClick={resetFilters} className="text-black text-xs font-bold hover:underline underline-offset-4">{t('reset')}</button>
                </div>
                <div className="space-y-8">
                  <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">{t('price_range')}</h4>
                    <div className="space-y-3">
                      {priceRanges.map((range) => (
                        <label key={range.id} className="flex items-center group cursor-pointer">
                          <div className="relative flex items-center justify-center">
                            <input type="checkbox" checked={selectedPriceRanges.includes(range.id)} onChange={() => handlePriceToggle(range.id)} className="peer appearance-none w-5 h-5 border-2 border-gray-200 rounded-lg checked:bg-primary checked:border-primary transition-all cursor-pointer" />
                            <div className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"><Check size={14} strokeWidth={4} /></div>
                          </div>
                          <span className="ml-3 text-sm font-bold text-black/70 group-hover:text-black transition-colors">{range.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-black">
                    {t('results')} <span className="text-gray-400">({filteredListings.length})</span>
                  </h2>
                  <p className="text-sm text-gray-400 font-medium">Showing active listings for this category.</p>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-wider whitespace-nowrap hidden sm:block">{t('sort_by')}</span>
                  <div className="relative">
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-black focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer pr-9">
                      <option value="most_recent">{t('most_recent')}</option>
                      <option value="price_low_high">{t('price_low_high')}</option>
                      <option value="price_high_low">{t('price_high_low')}</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative group mb-6">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search listings within this category"
                  className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-semibold text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-gray-200">
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading listings</p>
                </div>
              ) : !category ? (
                <div className="bg-gray-50 border border-gray-200 text-gray-500 px-10 py-12 rounded-[3rem] text-center">
                  <Package size={40} className="text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-black mb-2 text-black">Category not found</h3>
                  <p className="font-medium">The requested category does not exist yet.</p>
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 text-gray-500 px-10 py-12 rounded-[3rem] text-center">
                  <Package size={40} className="text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-black mb-2 text-black">No listings found</h3>
                  <p className="font-medium">Try adjusting your search or filter selection.</p>
                  <button onClick={resetFilters} className="mt-6 text-primary font-bold hover:underline">Reset filters</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                  {mappedListings.map((listing) => (
                    <PartCard key={listing.id} part={listing as any} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
