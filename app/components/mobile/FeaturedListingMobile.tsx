'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ShieldCheck, TrendingUp } from 'lucide-react';
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

  const mainFeatured = featuredListings[0];
  const secondaryFeatured = featuredListings.slice(1, 3);

  return (
    <div className="w-full px-4 my-4 bg-[#EAEFF9] lg:hidden">
      {/* Section Title */}
      <div className="flex items-center justify-between mb-3 ml-2">
        <h3 className="text-sm font-bold text-black-800 tracking-tight flex items-center gap-1.5">
          Featured Machines
        </h3>
        <Link href="/featured" className="text-xs font-semibold text-[#13BDC4] hover:underline">
          View all
        </Link>
      </div>

      {/* 1. Main Large Hero Featured Card */}
      {mainFeatured && (
        <Link href={`/listings/${mainFeatured.id}`} className="block relative w-full h-56 rounded-3xl overflow-hidden shadow-md group mb-3">
          {/* Background Image */}
          <Image
            src={mainFeatured.image_urls?.[0] || '/placeholder.png'}
            alt={mainFeatured.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/30 to-transparent" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
            <span className="bg-white/95 backdrop-blur-md text-[#13BDC4] px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase flex items-center gap-1 shadow-sm">
              <TrendingUp className="w-3 h-3" /> FEATURED
            </span>
            <span className="bg-[#13BDC4]/90 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED
            </span>
          </div>

          {/* Card Content (Bottom Overlay) */}
          <div className="absolute bottom-3 left-3.5 right-3.5 text-white z-10">
            {mainFeatured.brand && (
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block mb-0.5">
                {mainFeatured.brand}
              </span>
            )}
            <h4 className="text-sm font-bold text-white line-clamp-1 mb-1 leading-tight">
              {mainFeatured.title}
            </h4>
            <div className="flex items-center justify-between">
              <span className="text-base font-extrabold text-[#38e8ee]">
                USD {mainFeatured.price?.toLocaleString()}
              </span>
              <div className="flex items-center text-[10px] text-slate-200 gap-0.5">
                <MapPin className="w-3 h-3 text-slate-300 shrink-0" />
                <span className="truncate max-w-[100px]">{mainFeatured.location}</span>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* 2. Secondary Two Column Grid */}
      {secondaryFeatured.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {secondaryFeatured.map((item) => (
            <Link
              key={item.id}
              href={`/listings/${item.id}`}
              className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col"
            >
              {/* Image Container */}
              <div className="relative w-full h-28 bg-slate-100">
                <Image
                  src={item.image_urls?.[0] || '/placeholder.png'}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
                <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-[#13BDC4] px-2 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-0.5 shadow-sm">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              </div>

              {/* Text Info */}
              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <div>
                  {item.brand && (
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      {item.brand}
                    </span>
                  )}
                  <h5 className="text-xs font-bold text-slate-800 line-clamp-1 leading-tight mb-1">
                    {item.title}
                  </h5>
                </div>

                <div>
                  <div className="text-xs font-extrabold text-[#13BDC4]">
                    USD {item.price?.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                    {item.year || 'N/A'} • {item.condition || 'Used'}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}