'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bookmark, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

interface Listing {
  id: string;
  title: string;
  price: number | null;
  location: string | null;
  image_urls?: string[] | null;
  year?: string | null;
  brand?: string | null;
  category?: string | null;
  description?: string | null;
  hours?: string | null;
  condition?: string | null;
  seller_id?: string | null;
  status?: string | null;
  model?: string | null;
  origin?: string | null;
  stock_status?: string | null;
  phone_number?: string | null;
  contact_option?: string | null;
  is_featured?: boolean | null;
  created_at?: string | null;
}

export default function FeaturedListing({ initialListings }: { initialListings: Listing[] }) {
  const { t } = useLanguage();
  const [featuredListings, setFeaturedListings] = useState<Listing[]>(initialListings);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (!window.matchMedia('(min-width: 1024px)').matches) return;

    const fetchData = async () => {
      try {
        const meResponse = await fetch('/api/auth/me', { cache: 'no-store' });
        const meResult = await meResponse.json();
        if (meResponse.ok && meResult.success && meResult.user) {
          setUserId(meResult.user.id);
          const favResponse = await fetch('/api/favorites', { cache: 'no-store' });
          const favResult = await favResponse.json();
          if (favResponse.ok && favResult.success) setSavedIds((favResult.favorites || []).map((fav: any) => fav.listing_id));
        }

      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

  // Toggle Save / Bookmark status in Supabase Database
  const toggleSave = async (e: React.MouseEvent, listingId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      alert('Please log in to save listings to your favorites.');
      return;
    }

    const isSaved = savedIds.includes(listingId);
    setSavedIds((prev) =>
      isSaved ? prev.filter((id) => id !== listingId) : [...prev, listingId]
    );

    try {
      const response = await fetch('/api/favorites', {
        method: isSaved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Failed to update favorite');
    } catch (error) {
      console.error('Failed to update favorite:', error);
      setSavedIds((prev) =>
        isSaved ? [...prev, listingId] : prev.filter((id) => id !== listingId)
      );
    }
  };

  // Check overflow for optional scroll arrows
  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (el) {
      const scrollLeft = Math.ceil(el.scrollLeft);
      const maxScroll = el.scrollWidth - el.clientWidth;
      setCanScrollLeft(scrollLeft > 2);
      setCanScrollRight(scrollLeft < maxScroll - 2);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [featuredListings]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollContainerRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="w-full py-2 md:py-3">
      {/* Top Header */}
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{t('featured_items')}</h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">Featured listings from shops across Pakistan.</p>
        </div>

        <Link
          href="/buyer?featured=true#products"
          className="shrink-0 px-1 py-2 text-sm font-medium text-[#006b80] transition hover:text-[#004f60] sm:text-base"
        >
          View all featured products
        </Link>
      </div>

        <div className="relative group/carousel w-full">
          {featuredListings.length > 0 ? (
            <>
              {/* Scroll Left Button */}
              {canScrollLeft && (
                <button
                  onClick={() => scroll('left')}
                  aria-label="Scroll Left"
                  className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-md border border-slate-200 text-slate-700 shadow-lg transition-all hover:bg-[#13bdc4] hover:text-white hover:border-[#13bdc4] hover:scale-105 active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Product Cards Row */}
              <div
                ref={scrollContainerRef}
                onScroll={checkScroll}
                className="scrollbar-hide flex touch-pan-x overscroll-x-contain items-stretch gap-4 overflow-x-auto py-2 snap-x snap-mandatory scroll-smooth sm:gap-5"
              >
                {featuredListings.map((item) => {
                  const isSaved = savedIds.includes(item.id);
                  const displayImage =
                    item.image_urls && item.image_urls.length > 0
                      ? item.image_urls[0]
                      : '/placeholder-image.png';

                  return (
                    <Link
                      key={item.id}
                      href={`/listings/${item.id}`}
                      className="group relative flex w-[248px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-md sm:w-[calc((100%-3.75rem)/4)] sm:min-w-[230px]"
                    >
                      {/* Image Area */}
                      <div className="relative aspect-[3/2] w-full overflow-hidden bg-slate-100">
                        <Image
                          src={displayImage}
                          alt={item.title}
                          fill
                          sizes="(max-width: 640px) 46vw, 220px"
                          loading="lazy"
                          decoding="async"
                          quality={75}
                          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        />
                        <span className="absolute right-2 top-2 rounded-sm bg-rose-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow sm:right-2.5 sm:top-2.5 sm:px-2.5 sm:text-xs">Featured</span>
                        {item.condition && (
                          <span className="absolute left-2.5 top-2.5 rounded-md bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-sm">
                            {item.condition}
                          </span>
                        )}
                      </div>

                      {/* Title & Info */}
                      <div className="flex flex-col flex-grow justify-between p-2.5 sm:p-3">
                        <div>
                          <div className="line-clamp-2 min-h-9 text-sm font-semibold leading-5 text-slate-900 transition-colors group-hover:text-[#006b80]">
                            {item.title}
                          </div>
                          {item.brand && (
                            <div className="mt-1 truncate text-xs font-medium text-slate-500">
                              {item.brand} {item.model ? `• ${item.model}` : ''}
                            </div>
                          )}
                        </div>

                        {/* Price & Saved Icon Row */}
                        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                          <div className="min-w-0">
                            <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Price</div>
                            <div className="truncate text-sm font-bold text-[#006b80] sm:text-base">PKR {Number(item.price).toLocaleString()}</div>
                            {item.location && <div className="mt-1 flex items-center gap-1 truncate text-[11px] text-slate-500"><MapPin className="h-3 w-3 shrink-0" />{item.location}</div>}
                          </div>

                          {/* Save / Bookmark Button */}
                          <button
                            onClick={(e) => toggleSave(e, item.id)}
                            aria-label={isSaved ? 'Remove from saved listings' : 'Save listing'}
                            aria-pressed={isSaved}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
                              isSaved
                            ? 'bg-[#006b80] border-[#006b80] text-white'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-[#13bdc4] hover:text-[#13bdc4]'
                            }`}
                          >
                            <Bookmark
                              className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`}
                            />
                          </button>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Scroll Right Button */}
              {canScrollRight && (
                <button
                  onClick={() => scroll('right')}
                  aria-label="Scroll Right"
                  className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-md border border-slate-200 text-slate-700 shadow-lg transition-all hover:bg-[#13bdc4] hover:text-white hover:border-[#13bdc4] hover:scale-105 active:scale-95"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </>
          ) : (
            <div className="w-full rounded-2xl border border-dashed border-[#13bdc4]/30 bg-[#13bdc4]/5 backdrop-blur-sm p-8 text-center text-xs font-semibold text-slate-600">
              No featured products available right now.
            </div>
          )}
        </div>
    </section>
  );
}
