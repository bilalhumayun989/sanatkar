'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/auth/supabase/client';

interface Listing {
  id: string;
  title: string;
  price: number;
  category?: string;
  brand?: string;
  image_urls: string[];
  year?: string;
}

const ITEMS_PER_PAGE = 6;

export default function RecentListingsMobile() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  async function fetchListings(pageIndex: number, isInitial = false) {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    const supabase = createClient();
    const from = pageIndex * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error, count } = await supabase
      .from('listings')
      .select('id, title, price, category, brand, image_urls, year', { count: 'exact' })
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!error && data) {
      if (isInitial) {
        setListings(data);
      } else {
        setListings((prev) => [...prev, ...data]);
      }

      // Check if more items are available
      if (count !== null && from + data.length >= count) {
        setHasMore(false);
      } else if (data.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      }
    }

    setLoading(false);
    setLoadingMore(false);
  }

  useEffect(() => {
    fetchListings(0, true);
  }, []);

  const handleViewMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchListings(nextPage, false);
  };

  return (
    <div className="w-full px-4 my-5 lg:hidden">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">Recent Listings</h3>
      </div>

      {/* Grid View (2 Columns) */}
      <div className="grid grid-cols-2 gap-3">
        {loading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-2.5 space-y-2 border border-slate-100 shadow-sm"
              >
                <div className="w-full h-32 bg-slate-200 animate-pulse rounded-xl" />
                <div className="h-3 w-1/2 bg-slate-200 animate-pulse rounded" />
                <div className="h-4 w-3/4 bg-slate-200 animate-pulse rounded" />
                <div className="h-4 w-1/3 bg-slate-200 animate-pulse rounded" />
              </div>
            ))
          : listings.map((item) => (
              <Link
                key={item.id}
                href={`/listings/${item.id}`}
                className="bg-white rounded-2xl border border-slate-100/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col active:scale-[0.98] transition-transform duration-200"
              >
                {/* Image & Badge Container */}
                <div className="relative w-full h-32 bg-slate-100">
                  <Image
                    src={item.image_urls?.[0] || '/placeholder.png'}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                  <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-md text-[#13BDC4] px-2 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-0.5 shadow-sm">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                </div>

                {/* Content Container */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Category or Brand Header */}
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5 truncate">
                      {item.brand || item.category || 'MACHINE'}
                    </span>

                    {/* Title */}
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1 leading-snug mb-1">
                      {item.title}
                    </h4>
                  </div>

                  <div>
                    {/* Price */}
                    <div className="text-xs font-extrabold text-[#13BDC4] mb-0.5">
                      USD {item.price >= 1000 ? `${(item.price / 1000).toFixed(0)}K` : item.price}
                    </div>

                    {/* Year */}
                    <div className="text-[10px] text-slate-400 font-medium">
                      {item.year || '2024'}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
      </div>

      {/* View More Button */}
      {hasMore && !loading && (
        <div className="mt-5 text-center">
          <button
            onClick={handleViewMore}
            disabled={loadingMore}
            className="w-full py-2.5 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 text-[#13BDC4] animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              'View More'
            )}
          </button>
        </div>
      )}
    </div>
  );
}