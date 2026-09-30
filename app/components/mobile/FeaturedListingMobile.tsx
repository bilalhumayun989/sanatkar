'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { createClient } from '@/lib/auth/supabase/client';

interface Listing {
  id: string;
  title: string;
  price: number;
  location: string;
  image_urls: string[];
  year?: string;
  brand?: string;
  condition?: string;
  is_featured: boolean;
}

export default function FeaturedListingsMobile() {
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('listings')
        .select('id, title, price, location, image_urls, year, brand, condition, is_featured')
        .eq('is_featured', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(3); // Top 3 featured items for exact match with UI layout

      if (!error && data) {
        setFeaturedListings(data);
      }
      setLoading(false);
    }

    fetchFeatured();
  }, []);

  if (loading) {
    return (
      <div className="w-full px-4 my-4 space-y-3 lg:hidden">
        <div className="w-full h-52 bg-slate-200 animate-pulse rounded-3xl" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-44 bg-slate-200 animate-pulse rounded-2xl" />
          <div className="h-44 bg-slate-200 animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  if (featuredListings.length === 0) return null;

  return (
    <section className="w-full py-1 lg:hidden">
      {/* Section Title */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-slate-900">Featured products</h2>
        <Link href="/featured" className="shrink-0 text-sm font-semibold text-[#079bb5] hover:underline">
          View all
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {featuredListings.map((item) => (
            <Link
              key={item.id}
              href={`/listings/${item.id}`}
              className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <div className="relative aspect-square w-full bg-slate-100">
                <Image
                  src={item.image_urls?.[0] || '/placeholder.png'}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
                <span className="absolute left-2 top-2 rounded bg-white/95 px-2 py-1 text-[10px] font-semibold text-[#087c91] shadow-sm">
                  Featured
                </span>
              </div>

              <div className="flex flex-1 flex-col p-3">
                <div>
                  {item.brand && (
                    <span className="block truncate text-xs font-medium text-slate-500">
                      {item.brand}
                    </span>
                  )}
                  <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-900">
                    {item.title}
                  </h3>
                </div>

                <div className="mt-2">
                  <div className="text-sm font-bold text-[#079bb5]">
                    PKR {item.price?.toLocaleString()}
                  </div>
                  <div className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500">
                    <MapPin className="h-3 w-3 shrink-0" /> {item.location || 'Pakistan'}
                  </div>
                </div>
              </div>
            </Link>
          ))}
      </div>
    </section>
  );
}