'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/auth/supabase/client';

interface Listing {
  id: string;
  title: string;
  price: number;
  location: string;
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

export default function FeaturedListing() {
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();

        // Check user authentication
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUserId(user.id);

          // Fetch user's initial saved favorites
          const { data: userFavs } = await supabase
            .from('favorites')
            .select('listing_id')
            .eq('user_id', user.id);

          if (userFavs) {
            setSavedIds(userFavs.map((fav) => fav.listing_id));
          }
        }

        // Fetch active featured listings
        const { data: listings, error } = await supabase
          .from('listings')
          .select('*')
          .eq('status', 'active')
          .eq('is_featured', true)
          .order('created_at', { ascending: false })
          .limit(6);

        if (error) {
          console.error('Error fetching featured listings:', error);
          setFeaturedListings([]);
        } else {
          setFeaturedListings(listings || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setFeaturedListings([]);
      } finally {
        setLoading(false);
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

    const supabase = createClient();
    const isSaved = savedIds.includes(listingId);

    // Optimistic UI update
    setSavedIds((prev) =>
      isSaved ? prev.filter((id) => id !== listingId) : [...prev, listingId]
    );

    try {
      if (isSaved) {
        // Delete favorite
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('listing_id', listingId);

        if (error) throw error;
      } else {
        // Insert favorite
        const { error } = await supabase.from('favorites').insert({
          user_id: userId,
          listing_id: listingId,
        });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Failed to update favorite:', error);
      // Revert state if DB operation fails
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
    <section className="container-wide py-10 md:py-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 md:mb-12 gap-4">
        <div className="text-left max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-600 shadow-sm mb-3">
            Trending
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Featured Items
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Explore curated industrial categories and discover precision parts and machinery.
          </p>
        </div>

        <Link
          href="/buyer"
          className="self-start md:self-auto inline-flex items-center justify-center rounded-full bg-cyan-600 hover:bg-cyan-700 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
        >
          View All
        </Link>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-slate-100/60 rounded-2xl h-64 animate-pulse"></div>
          ))}
        </div>
      ) : (
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
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto py-2 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden"
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
                      className="group relative flex flex-col justify-between w-[200px] sm:w-[240px] shrink-0 snap-start rounded-2xl bg-[#0092b8] p-3.5 transition-transform duration-300 hover:shadow-xl hover:-translate-y-1"
                    >
                      {/* Image Area */}
                      <div className="relative aspect-square w-full rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center mb-3">
                        <Image
                          src={displayImage}
                          alt={item.title}
                          fill
                          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        />
                        {item.condition && (
                          <span className="absolute top-2 left-2 rounded-md bg-white/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-slate-700 shadow-sm uppercase tracking-wider">
                            {item.condition}
                          </span>
                        )}
                      </div>

                      {/* Title & Info */}
                      <div className="flex flex-col flex-grow justify-between">
                        <div>
                          <div className="text-sm font-bold text-white tracking-tight line-clamp-1">
                            {item.title}
                          </div>
                          {item.brand && (
                            <div className="text-[11px] text-white/90 mt-0.5 font-medium">
                              {item.brand} {item.model ? `• ${item.model}` : ''}
                            </div>
                          )}
                        </div>

                        {/* Price & Saved Icon Row */}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/20">
                          <div className="text-sm sm:text-base font-black text-white">
                            PKR {Number(item.price).toLocaleString()}
                          </div>

                          {/* Save / Bookmark Button */}
                          <button
                            onClick={(e) => toggleSave(e, item.id)}
                            aria-label="Save listing"
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
                              isSaved
                                ? 'bg-[#13bdc4] border-[#13bdc4] text-white shadow-sm'
                                : 'bg-white/80 border-slate-200 text-slate-500 hover:border-[#13bdc4] hover:text-[#13bdc4]'
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
      )}
    </section>
  );
}