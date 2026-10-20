'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { ArrowLeft, MapPin, ShieldCheck, TrendingUp } from 'lucide-react';

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

export default function FeaturedPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await fetch('/api/listings?featured=true&limit=24', { cache: 'no-store' });
        const result = await response.json();
        if (response.ok && result.success && Array.isArray(result.data)) setListings(result.data as Listing[]);
      } catch (error) {
        console.error('Featured listings fetch failed:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 pt-35 pb-14 lg:pt-24">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-slate-200 text-slate-700">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#13BDC4]">Featured</p>
            <h1 className="text-2xl font-black text-slate-900">Featured Machines</h1>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-72 animate-pulse rounded-3xl bg-slate-200" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            No featured listings found right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {listings.map((item) => (
              <Link
                key={item.id}
                href={`/listings/${item.id}`}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#13BDC4]/40"
              >
                <div className="relative h-52 w-full overflow-hidden">
                  <img
                    src={item.image_urls?.[0] || '/placeholder.png'}
                    alt={item.title}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                  <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#13BDC4] shadow-sm">
                    <TrendingUp className="h-3 w-3" /> Featured
                  </div>
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[#13BDC4]/90 px-2.5 py-1 text-[9px] font-bold text-white shadow-sm">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    {item.brand && (
                      <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-300">{item.brand}</div>
                    )}
                    <div className="mt-1 text-base font-black leading-tight">{item.title}</div>
                  </div>
                </div>

                <div className="space-y-2 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-lg font-black text-[#13BDC4]">
                      PKR {Number(item.price || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                      {item.condition || 'Used'}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{item.location || 'Pakistan'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
